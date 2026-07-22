import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const compose = await readFile(new URL('../../compose.yaml', import.meta.url), 'utf8');
const dockerfile = await readFile(new URL('../../Dockerfile', import.meta.url), 'utf8');
const redisDockerfile = await readFile(
  new URL('../../infrastructure/redis/Dockerfile', import.meta.url),
  'utf8',
);
const redisEntrypoint = await readFile(
  new URL('../../infrastructure/redis/secure-entrypoint.sh', import.meta.url),
  'utf8',
);

test('redis credentials are mounted as a secret and absent from process arguments', () => {
  assert.match(compose, /redis_password:\n\s+environment: REDIS_PASSWORD/);
  assert.match(compose, /REDIS_PASSWORD_FILE: \/run\/secrets\/redis_password/);
  assert.doesNotMatch(compose, /--requirepass/);
  assert.doesNotMatch(compose, /redis-cli\s+-a/);
  assert.match(redisEntrypoint, /REDISCLI_AUTH="\$password" exec redis-cli ping/);
  assert.match(redisEntrypoint, /exec redis-server "\$config_file"/);
});

test('application containers run non-root with a read-only root filesystem', () => {
  assert.match(compose, /x-app:[\s\S]*?user: node/);
  assert.match(compose, /x-app:[\s\S]*?read_only: true/);
  assert.match(compose, /x-app:[\s\S]*?cap_drop: \[ALL\]/);
  assert.match(compose, /x-app:[\s\S]*?no-new-privileges:true/);
  assert.match(dockerfile, /USER node/);
  assert.match(dockerfile, /corepack prepare pnpm@10\.32\.0 --activate/);
});

test('services declare bounded logs, graceful shutdown, and resource constraints', () => {
  assert.match(compose, /max-size: 10m/);
  assert.match(compose, /max-file: "3"/);
  assert.match(compose, /stop_grace_period:/);
  assert.match(compose, /mem_limit:/);
  assert.match(compose, /cpus:/);
});

test('setup uses the canonical package manager and redis runs unprivileged', () => {
  assert.match(compose, /pnpm run db:migrate && pnpm run db:seed:production/);
  assert.doesNotMatch(compose, /(^|[^p])npm run db:migrate/);
  assert.match(redisDockerfile, /USER redis/);
  assert.match(redisDockerfile, /ENTRYPOINT \["\/usr\/local\/bin\/neon-redis"\]/);
});
