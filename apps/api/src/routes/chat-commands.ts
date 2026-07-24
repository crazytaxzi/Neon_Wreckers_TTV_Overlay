import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiContext } from '../types.js';
import { requireAdmin } from '../services/auth.js';
import { loadChatCommands, retireChatCommand, saveChatCommand } from '../services/chat-commands.js';

const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('scan') }),
  z.object({ type: z.literal('salvage'), mode: z.enum(['cutters', 'cargo']) }),
  z.object({ type: z.literal('point_action'), slug: z.enum(['rush_scan', 'safety_override']) })
]);

const commandBody = z.object({
  trigger: z.string().trim().min(2).max(80).regex(/^![a-z0-9][a-z0-9 _-]*$/i),
  description: z.string().trim().min(3).max(240),
  enabled: z.boolean().default(true),
  requiresPlayer: z.boolean().default(true),
  action: actionSchema
});

export async function registerChatCommandRoutes(app: FastifyInstance, context: ApiContext) {
  app.get('/api/v1/admin/chat-commands', async request => {
    await requireAdmin(context.prisma, request);
    return { data: await loadChatCommands(context.prisma), requestId: request.id };
  });

  app.post('/api/v1/admin/chat-commands', async request => {
    const admin = await requireAdmin(context.prisma, request);
    const body = commandBody.parse(request.body);
    return { data: await saveChatCommand(context.prisma, admin.id, { id: '', ...body }, request.id), requestId: request.id };
  });

  app.put('/api/v1/admin/chat-commands/:id', async request => {
    const admin = await requireAdmin(context.prisma, request);
    const id = z.string().min(1).max(120).parse((request.params as { id: string }).id);
    const body = commandBody.parse(request.body);
    return { data: await saveChatCommand(context.prisma, admin.id, { id, ...body }, request.id), requestId: request.id };
  });

  app.delete('/api/v1/admin/chat-commands/:id', async request => {
    const admin = await requireAdmin(context.prisma, request);
    const id = z.string().min(1).max(120).parse((request.params as { id: string }).id);
    await retireChatCommand(context.prisma, admin.id, id, request.id);
    return { data: { retired: true }, requestId: request.id };
  });
}
