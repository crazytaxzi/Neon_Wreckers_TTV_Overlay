import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const ignored = new Set(['.git', '.pnpm-store', 'node_modules', 'backups']);

function walk(directory = root) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(target));
    else files.push(path.relative(root, target).replaceAll(path.sep, '/'));
  }
  return files;
}

const files = walk();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('repository exposes exactly one deployment pipeline', () => {
  assert.deepEqual(files.filter(file => path.basename(file) === 'Dockerfile'), ['Dockerfile']);
  assert.deepEqual(files.filter(file => /^compose(?:\..+)?\.ya?ml$/.test(path.basename(file))), ['compose.yaml']);
  assert.deepEqual(files.filter(file => /nginx.*\.conf(?:\.template)?$/.test(path.basename(file))), ['infrastructure/gateway/nginx.conf.template']);
  assert.deepEqual(files.filter(file => /(?:package-lock\.json|yarn\.lock)$/.test(file)), []);
  assert.ok(files.includes('pnpm-lock.yaml'));
  assert.ok(files.includes('pnpm-workspace.yaml'));
});

test('repository contains no recovery copies, generated builds, or committed secrets', () => {
  const forbiddenPaths = files.filter(file => /(^|\/)(?:dist|coverage)(\/|$)|\.tsbuildinfo$|(^|\/)(?:[^/]*-backup-[^/]*|backup-\d[^/]*|recovery[^/]*|certbot-www|ip-gateway)(\/|$)|\.env\.backup/i.test(file));
  assert.deepEqual(forbiddenPaths, []);
  const trackedEnvironmentFiles = execFileSync('git', ['-c', `safe.directory=${root}`, 'ls-files'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(file => path.basename(file).startsWith('.env') && file !== '.env.example');
  assert.deepEqual(trackedEnvironmentFiles, []);
  const unfinishedMarkers = new RegExp(`\\b(?:${['TO', 'DO'].join('')}|${['FIX', 'ME'].join('')})\\b`);
  const textFiles = files.filter(file => !/package-lock\.json$/.test(file));
  for (const file of textFiles) {
    const content = fs.readFileSync(path.join(root, file));
    if (content.includes(0)) continue;
    assert.doesNotMatch(content.toString('utf8'), unfinishedMarkers, `${file} contains unfinished work markers.`);
  }
});

test('gateway serves every supported surface and upgrades WebSockets', () => {
  const nginx = read('infrastructure/gateway/nginx.conf.template');
  for (const route of ['location / {', 'location ^~ /admin/', 'location ^~ /overlay/', 'location /api/']) {
    assert.ok(nginx.includes(route), `Gateway is missing ${route}`);
  }
  assert.match(nginx, /proxy_set_header Upgrade \$http_upgrade;/);
  assert.match(nginx, /proxy_set_header Connection \$connection_upgrade;/);
  assert.doesNotMatch(nginx, /recovery|overlay-v\d+|proxy_params/i);
});

test('compose contains only the supported production services', () => {
  const compose = read('compose.yaml');
  for (const service of ['postgres:', 'redis:', 'setup:', 'api:', 'worker:', 'gateway:']) {
    assert.ok(compose.includes(`  ${service}`), `Compose is missing ${service}`);
  }
  assert.doesNotMatch(compose, /minio|source:|node_modules|npm install/i);
});


test('workspace lock contains every active package and no retired dependencies', () => {
  const workspaceManifests = files
    .filter(file => /^(?:apps|packages)\/[^/]+\/package\.json$/.test(file))
    .map(file => JSON.parse(read(file)).name)
    .sort();
  assert.deepEqual(workspaceManifests, [
    '@neon-wreckers/admin',
    '@neon-wreckers/api',
    '@neon-wreckers/browser-client',
    '@neon-wreckers/client-theme',
    '@neon-wreckers/content',
    '@neon-wreckers/game-engine',
    '@neon-wreckers/integrations',
    '@neon-wreckers/overlay',
    '@neon-wreckers/ui',
    '@neon-wreckers/web',
    '@neon-wreckers/worker'
  ]);

  const lock = read('pnpm-lock.yaml');
  for (const importer of ['apps/admin', 'apps/api', 'apps/overlay', 'apps/web', 'apps/worker', 'packages/browser-client', 'packages/client-theme', 'packages/content', 'packages/game-engine', 'packages/integrations', 'packages/ui']) {
    assert.match(lock, new RegExp(`^  ${importer.replaceAll('/', '\\/')}:`, 'm'), `Missing lockfile importer: ${importer}`);
  }
  for (const retired of ['@neon-wreckers/game-config', '@neon-wreckers/shared-types', 'minio']) {
    assert.ok(!lock.includes(retired), `Retired dependency remains in pnpm-lock.yaml: ${retired}`);
  }
});

test('required operational documentation and scripts are present', () => {
  const required = [
    'README.md', 'CHANGELOG.md',
    'docs/ARCHITECTURE.md', 'docs/DEPLOYMENT.md', 'docs/DEVELOPER_GUIDE.md',
    'docs/ADMIN_GUIDE.md', 'docs/OVERLAY_GUIDE.md', 'docs/DEPENDENCY_AUDIT.md',
    'docs/UI_DESIGN_SYSTEM.md', 'docs/THEME_TOKEN_GUIDE.md', 'docs/FRONTEND_VISUAL_GUIDE.md',
    'docs/PHASE_2_UI_REPORT.md', 'docs/TEST_REPORT.md', 'docs/DEPLOYMENT_VERIFICATION.md', 'docs/CHANGE_SUMMARY.md',
    'apps/README.md', 'packages/README.md', 'content/README.md',
    'infrastructure/README.md', 'scripts/README.md', 'assets/README.md',
    'scripts/install.sh', 'scripts/update.sh', 'scripts/backup.sh', 'scripts/restore.sh', 'scripts/verify.sh'
  ];
  for (const file of required) assert.ok(files.includes(file), `Missing required file: ${file}`);
  for (const script of required.filter(file => file.endsWith('.sh'))) {
    assert.ok((fs.statSync(path.join(root, script)).mode & 0o111) !== 0, `${script} is not executable.`);
  }
});

test('every configured environment variable is documented', () => {
  const envNames = read('.env.example').split('\n')
    .filter(line => /^[A-Z][A-Z0-9_]*=/.test(line))
    .map(line => line.slice(0, line.indexOf('=')));
  const deploymentGuide = read('docs/DEPLOYMENT.md');
  for (const name of envNames) assert.ok(deploymentGuide.includes(`\`${name}\``), `Undocumented environment variable: ${name}`);
});

test('production safeguards remain wired into state-changing paths', () => {
  const salvage = read('apps/api/src/services/salvage.ts');
  const construction = read('apps/api/src/routes/construction.ts');
  const expeditions = read('apps/api/src/routes/expeditions.ts');
  const worker = read('apps/worker/src/index.ts');
  const auth = read('apps/api/src/services/auth.ts');

  assert.match(salvage, /acquireTransactionLock\(transaction, WRECK_LOCK_KEY\)/);
  assert.match(construction, /quantity: \{ gte: accepted \}/);
  assert.match(construction, /if \(remaining === 0\) continue;/, 'completed construction requirements must not deduct more inventory');
  assert.match(expeditions, /status: \{ in: \['resolved', 'failed'\] \}/);
  assert.match(worker, /where: \{ id: expedition\.id, status: 'active' \}/);
  assert.match(worker, /status: 'active', resolvesAt: \{ lte: now \}/, 'worker must reconcile overdue expeditions when delayed jobs are lost');
  assert.doesNotMatch(worker, /season-tick/);
  assert.match(auth, /signed: true/);
});


test('canonical content is injected into the engine instead of duplicated', () => {
  const engine = read('packages/game-engine/src/core.mjs');
  assert.doesNotMatch(engine, /WRECK_ARCHETYPES|\bITEMS\b|createInitialStation|wreck-helios-courier|item-hull-scrap/);
  assert.ok(files.includes('content/base/station.json'));
  assert.ok(files.includes('packages/content/src/index.mjs'));
  assert.ok(!files.includes('apps/api/src/services/game-config.ts'));

  const salvage = read('apps/api/src/services/salvage.ts');
  const expeditions = read('apps/api/src/routes/expeditions.ts');
  const worker = read('apps/worker/src/index.ts');
  const seed = read('infrastructure/database/seed/seed.ts');
  for (const source of [salvage, expeditions, worker, seed]) {
    assert.match(source, /@neon-wreckers\/content/);
  }
});

test('operational scripts retain deterministic install and recovery safeguards', () => {
  const install = read('scripts/install.sh');
  const backup = read('scripts/backup.sh');
  const restore = read('scripts/restore.sh');
  const update = read('scripts/update.sh');

  assert.match(install, /Ubuntu 24\.04 LTS/);
  assert.match(install, /download\.docker\.com\/linux\/ubuntu/);
  assert.match(install, /docker-ce docker-ce-cli containerd\.io docker-buildx-plugin docker-compose-plugin/);
  assert.doesNotMatch(install, /--ip-address|preferred-profile/);
  assert.match(backup, /sha256sum/);
  assert.match(restore, /unsafe path/);
  assert.match(restore, /sha256sum -c SHA256SUMS/);
  assert.match(update, /--pre-hook/);
  assert.match(update, /--post-hook/);
});

test('synthetic identities and mock loyalty are absent while renewable credentials are encrypted', () => {
  const source = files
    .filter(file => /^(?:apps|packages)\/.+\.(?:ts|tsx|js|mjs)$/.test(file))
    .map(read)
    .join('\n');
  assert.doesNotMatch(source, /auth\/dev|MockLoyaltyProvider/);
  assert.match(read('apps/api/src/services/twitch-credentials.ts'), /createCipheriv\('aes-256-gcm'/);
  assert.match(read('infrastructure/database/prisma/schema.prisma'), /accessTokenEncrypted/);
});
