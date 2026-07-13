import { env } from './env.js';
import { buildApp } from './app.js';

const app = await buildApp();
await app.listen({ port: env.PORT, host: '0.0.0.0' });

let closing = false;
async function shutdown(signal: string) {
  if (closing) return;
  closing = true;
  app.log.info({ signal }, 'shutting down');
  try {
    await app.close();
  } catch (error) {
    app.log.error({ err: error, signal }, 'graceful shutdown failed');
    process.exitCode = 1;
  }
}

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
