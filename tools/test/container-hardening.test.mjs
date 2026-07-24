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
const materializeSecrets = await readFile(
  new URL('../../scripts/materialize-secrets.sh', import.meta.url),
  'utf8',
);
const updateScript = await readFile(new URL('../../scripts/update.sh', import.meta.url), 'utf8');
const installScript = await readFile(new URL('../../scripts/install.sh', import.meta.url), 'utf8');

test('redis credentials are mounted as a file-backed secret and absent from process arguments', () => {
  assert.match(compose, /redis_password:\n\s+file: \.\/\.secrets\/redis_password/);
  assert.doesNotMatch(compose, /redis_password:\n\s+environment:/);
  assert.match(compose, /REDIS_PASSWORD_FILE: \/run\/secrets\/redis_password/);
  assert.doesNotMatch(compose, /--requirepass/);
  assert.doesNotMatch(compose, /redis-cli\s+-a/);
  assert.match(redisEntrypoint, /REDISCLI_AUTH="\$password" exec redis-cli ping/);
  assert.match(redisEntrypoint, /exec redis-server "\$config_file"/);
});

test('install and update materialize the ignored secret file before compose runs', () => {
  assert.match(materializeSecrets, /materialize_runtime_secrets/);
  assert.match(materializeSecrets, /secret_file="\$secret_dir\/redis_password"/);
  assert.match(materializeSecrets, /chmod 0444 "\$temp_file"/);
  assert.match(updateScript, /materialize_runtime_secrets "\$ROOT_DIR"/);
  assert.match(installScript, /materialize_runtime_secrets "\$ROOT_DIR"/);
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

test('setup runs bundled migration and seed executables without a runtime package manager', () => {
  assert.match(
    compose,
    /\.\/node_modules\/\.bin\/prisma migrate deploy --schema infrastructure\/database\/prisma\/schema\.prisma/,
  );
  assert.match(compose, /node infrastructure\/database\/dist\/seed\/seed\.js/);
  assert.doesNotMatch(compose, /command: \["sh", "-c", "pnpm run db:migrate/);
  assert.match(redisDockerfile, /USER redis/);
  assert.match(redisDockerfile, /ENTRYPOINT \["\/usr\/local\/bin\/neon-redis"\]/);
});
