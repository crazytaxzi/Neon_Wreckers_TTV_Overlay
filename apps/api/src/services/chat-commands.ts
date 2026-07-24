import type { Prisma, PrismaClient } from '@prisma/client';
import { acquireTransactionLock } from '../lib/database.js';

const commandPrefix = 'chat-command.';

export type ChatCommandAction =
  | { type: 'scan' }
  | { type: 'salvage'; mode: 'cutters' | 'cargo' }
  | { type: 'point_action'; slug: 'rush_scan' | 'safety_override' };

export type ChatCommand = {
  id: string;
  trigger: string;
  description: string;
  enabled: boolean;
  requiresPlayer: boolean;
  action: ChatCommandAction;
  updatedAt: Date | null;
  source: 'default' | 'configured';
};

export const defaultChatCommands: ChatCommand[] = [
  { id: 'scan', trigger: '!scan', description: 'Scan for a new wreck.', enabled: true, requiresPlayer: true, action: { type: 'scan' }, updatedAt: null, source: 'default' },
  { id: 'salvage-cutters', trigger: '!salvage cutters', description: 'Deploy cutters against the active wreck.', enabled: true, requiresPlayer: true, action: { type: 'salvage', mode: 'cutters' }, updatedAt: null, source: 'default' },
  { id: 'salvage-cargo', trigger: '!salvage cargo', description: 'Deploy cargo recovery against the active wreck.', enabled: true, requiresPlayer: true, action: { type: 'salvage', mode: 'cargo' }, updatedAt: null, source: 'default' },
  { id: 'rushscan', trigger: '!rushscan', description: 'Spend StreamElements points to rush a wreck scan.', enabled: true, requiresPlayer: true, action: { type: 'point_action', slug: 'rush_scan' }, updatedAt: null, source: 'default' },
  { id: 'override', trigger: '!override', description: 'Spend StreamElements points on a safety override salvage run.', enabled: true, requiresPlayer: true, action: { type: 'point_action', slug: 'safety_override' }, updatedAt: null, source: 'default' }
];

function normalizeTrigger(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function slugForId(id: string) {
  return `${commandPrefix}${id}`;
}

function configuredCommand(version: { slug: string; lifecycle: string; contentJson: unknown; createdAt: Date }): ChatCommand | null {
  if (version.lifecycle === 'retired') return null;
  const raw = version.contentJson as Record<string, unknown>;
  const action = raw.action as ChatCommandAction | undefined;
  if (!action || typeof action.type !== 'string') return null;
  return {
    id: version.slug.slice(commandPrefix.length),
    trigger: normalizeTrigger(String(raw.trigger ?? '')),
    description: String(raw.description ?? ''),
    enabled: raw.enabled !== false,
    requiresPlayer: true,
    action,
    updatedAt: version.createdAt,
    source: 'configured'
  };
}

function jsonClone(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function latestConfigured(prisma: PrismaClient) {
  const versions = await prisma.contentVersion.findMany({
    where: { slug: { startsWith: commandPrefix } },
    orderBy: [{ slug: 'asc' }, { version: 'desc' }]
  });
  const latest = new Map<string, typeof versions[number]>();
  for (const version of versions) if (!latest.has(version.slug)) latest.set(version.slug, version);
  return latest;
}

export async function loadChatCommands(prisma: PrismaClient): Promise<ChatCommand[]> {
  const configured = await latestConfigured(prisma);
  const merged = new Map(defaultChatCommands.map(command => [command.id, command]));
  for (const [slug, version] of configured) {
    const id = slug.slice(commandPrefix.length);
    const command = configuredCommand(version);
    if (command) merged.set(id, command);
    else merged.delete(id);
  }
  return [...merged.values()].sort((left, right) => left.trigger.localeCompare(right.trigger));
}

export async function findChatCommand(prisma: PrismaClient, text: string) {
  const normalized = normalizeTrigger(text);
  if (!normalized.startsWith('!')) return null;
  return (await loadChatCommands(prisma)).find(command => command.enabled && command.trigger === normalized) ?? null;
}

export async function saveChatCommand(
  prisma: PrismaClient,
  actorId: string,
  command: Omit<ChatCommand, 'updatedAt' | 'source'>,
  requestId: string
) {
  const id = command.id || command.trigger.slice(1).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!id) throw new Error('Command trigger must include a usable name.');
  const slug = slugForId(id);
  const normalized = { ...command, id, trigger: normalizeTrigger(command.trigger), requiresPlayer: true };
  const duplicate = (await loadChatCommands(prisma)).find(existing => existing.trigger === normalized.trigger && existing.id !== id);
  if (duplicate) throw new Error(`The trigger ${normalized.trigger} is already assigned to ${duplicate.trigger}.`);
  return prisma.$transaction(async transaction => {
    await acquireTransactionLock(transaction, `content-version:${slug}`);
    const latest = await transaction.contentVersion.findFirst({ where: { slug }, orderBy: { version: 'desc' } });
    const created = await transaction.contentVersion.create({
      data: {
        slug,
        version: (latest?.version ?? 0) + 1,
        lifecycle: 'active',
        contentJson: jsonClone(normalized),
        validation: { allowlist: true },
        publishedAt: new Date(),
        createdById: actorId
      }
    });
    await transaction.auditLog.create({
      data: {
        actorId,
        action: 'chat-command.save',
        target: slug,
        before: latest ? jsonClone(latest.contentJson) : undefined,
        after: jsonClone(normalized),
        requestId
      }
    });
    return configuredCommand(created);
  });
}

export async function retireChatCommand(prisma: PrismaClient, actorId: string, id: string, requestId: string) {
  const slug = slugForId(id);
  return prisma.$transaction(async transaction => {
    await acquireTransactionLock(transaction, `content-version:${slug}`);
    const latest = await transaction.contentVersion.findFirst({ where: { slug }, orderBy: { version: 'desc' } });
    const created = await transaction.contentVersion.create({
      data: {
        slug,
        version: (latest?.version ?? 0) + 1,
        lifecycle: 'retired',
        contentJson: latest?.contentJson ?? {},
        validation: { allowlist: true },
        createdById: actorId
      }
    });
    await transaction.auditLog.create({
      data: { actorId, action: 'chat-command.retire', target: slug, before: latest ? jsonClone(latest.contentJson) : undefined, after: { retired: true }, requestId }
    });
    return created;
  });
}
