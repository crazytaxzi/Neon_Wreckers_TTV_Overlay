import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { env } from '../env.js';
import type { ApiContext, AuthenticatedUserWithPlayer } from '../types.js';
import { deploySalvage, scanForWreck } from '../services/salvage.js';
import { executePointAction } from '../services/points.js';

type EventSubEnvelope = {
  challenge?: string;
  subscription?: { type?: string; status?: string };
  event?: Record<string, unknown>;
};

function header(request: { headers: Record<string, unknown> }, name: string) {
  const value = request.headers[name.toLowerCase()];
  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
}

function verifyEventSub(request: { headers: Record<string, unknown> }, raw: Buffer) {
  const id = header(request, 'twitch-eventsub-message-id');
  const timestamp = header(request, 'twitch-eventsub-message-timestamp');
  const supplied = header(request, 'twitch-eventsub-message-signature');
  if (!id || !timestamp || !supplied || Math.abs(Date.now() - Date.parse(timestamp)) > 10 * 60_000) return false;
  const expected = `sha256=${crypto.createHmac('sha256', env.TWITCH_EVENTSUB_SECRET).update(id + timestamp).update(raw).digest('hex')}`;
  return supplied.length === expected.length && crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

async function runChatCommand(context: ApiContext, event: Record<string, unknown>, messageId: string) {
  const message = event.message as { text?: string } | undefined;
  const text = String(message?.text ?? '').trim().toLowerCase();
  if (!text.startsWith('!')) return;
  const twitchUserId = String(event.chatter_user_id ?? '');
  const user = await context.prisma.user.findUnique({ where: { twitchUserId }, include: { player: true } });
  if (!user?.player) return;
  const actor = user as unknown as AuthenticatedUserWithPlayer;
  if (text === '!scan') await scanForWreck(context, actor);
  if (text === '!salvage cutters') await deploySalvage(context, actor, 'cutters');
  if (text === '!salvage cargo') await deploySalvage(context, actor, 'cargo');
  if (text === '!rushscan') await executePointAction(context, actor, 'rush_scan', `twitch:${messageId}`);
  if (text === '!override') await executePointAction(context, actor, 'safety_override', `twitch:${messageId}`);
}

export async function registerEventSubRoutes(app: FastifyInstance, context: ApiContext) {
  await app.register(async eventApp => {
    eventApp.removeContentTypeParser('application/json');
    eventApp.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_request, body, done) => done(null, body));
    eventApp.post('/api/v1/integrations/twitch/eventsub', async (request, reply) => {
      const raw = request.body as Buffer;
      if (!Buffer.isBuffer(raw) || !verifyEventSub(request as never, raw)) return reply.code(403).send({ error: { code: 'INVALID_EVENTSUB_SIGNATURE', message: 'Invalid Twitch signature.' }, requestId: request.id });
      const payload = JSON.parse(raw.toString('utf8')) as EventSubEnvelope;
      const messageType = header(request as never, 'twitch-eventsub-message-type');
      if (messageType === 'webhook_callback_verification') return reply.type('text/plain').send(payload.challenge ?? '');
      if (messageType === 'revocation') return reply.code(204).send();
      const externalId = header(request as never, 'twitch-eventsub-message-id');
      const eventType = String(payload.subscription?.type ?? 'unknown');
      const created = await context.prisma.externalEvent.createMany({ data: [{ provider: 'twitch', externalId, type: eventType, actorId: String(payload.event?.user_id ?? payload.event?.chatter_user_id ?? '') || null, payload: JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue }], skipDuplicates: true });
      if (!created.count) return reply.code(204).send();
      if (eventType === 'channel.chat.message' && payload.event) {
        await runChatCommand(context, payload.event, externalId).catch(error => request.log.warn({ err: error, externalId }, 'chat command rejected'));
      } else if (payload.event) {
        const displayName = String(payload.event.user_name ?? payload.event.from_broadcaster_user_name ?? 'A viewer');
        const title = eventType.includes('raid') ? 'Raid party arrived' : eventType.includes('subscribe') ? 'Station supporter linked' : eventType.includes('cheer') ? 'Cheer signal received' : 'Viewer signal received';
        const station = await context.prisma.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
        const history = await context.prisma.historyEntry.create({ data: { stationId: station.id, category: 'twitch', title, body: `${displayName} triggered ${eventType.replaceAll('.', ' ')}.`, actorDisplayName: displayName } });
        context.realtime.broadcast({ type: 'history.added', entry: history });
      }
      await context.prisma.externalEvent.update({ where: { provider_externalId: { provider: 'twitch', externalId } }, data: { processedAt: new Date() } });
      return reply.code(204).send();
    });
  });
}
