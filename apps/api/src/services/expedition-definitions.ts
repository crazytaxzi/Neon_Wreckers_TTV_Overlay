import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { expeditionDefinitions, itemsBySlug, type ExpeditionDefinition } from '@neon-wreckers/content';

export const authoredExpeditionSchema = z.object({
  slug: z.string().trim().min(3).max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().min(12).max(320),
  risk: z.enum(['low', 'moderate', 'high', 'extreme']),
  fuelCost: z.number().int().min(1).max(10),
  minCrew: z.number().int().min(1).max(5),
  lootPool: z.array(z.string()).min(1).max(16).refine(values => new Set(values).size === values.length, 'Loot items must be unique.'),
  lootRolls: z.number().int().min(1).max(8),
  durationMinutes: z.tuple([z.number().int().min(1).max(1_440), z.number().int().min(1).max(1_440)])
}).superRefine((definition, context) => {
  if (definition.durationMinutes[1] < definition.durationMinutes[0]) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Maximum duration must be at least the minimum duration.', path: ['durationMinutes', 1] });
  }
  definition.lootPool.forEach((slug, index) => {
    if (!itemsBySlug[slug]) context.addIssue({ code: z.ZodIssueCode.custom, message: `Unknown loot item: ${slug}`, path: ['lootPool', index] });
  });
});

export type AuthoredExpeditionDefinition = z.infer<typeof authoredExpeditionSchema>;

export async function activeExpeditionDefinitions(prisma: Pick<PrismaClient, 'contentVersion'>) {
  const authored = await prisma.contentVersion.findMany({
    where: {
      slug: { startsWith: 'expedition.' },
      lifecycle: 'active',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
    },
    orderBy: { version: 'desc' }
  });
  const definitions = new Map<string, ExpeditionDefinition>();
  const authoredSlugs = new Set<string>();
  for (const definition of Object.values(expeditionDefinitions)) definitions.set(definition.slug, definition);
  for (const version of authored) {
    const parsed = authoredExpeditionSchema.safeParse(version.contentJson);
    if (parsed.success && version.slug === `expedition.${parsed.data.slug}` && !authoredSlugs.has(parsed.data.slug)) {
      definitions.set(parsed.data.slug, parsed.data);
      authoredSlugs.add(parsed.data.slug);
    }
  }
  return Object.fromEntries(definitions) as Record<string, ExpeditionDefinition>;
}

export function expeditionSnapshot(value: unknown, fallback: ExpeditionDefinition | undefined) {
  const parsed = authoredExpeditionSchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}
