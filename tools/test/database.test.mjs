import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const schemaPath = 'infrastructure/database/prisma/schema.prisma';
const migrationsRoot = 'infrastructure/database/prisma/migrations';
const migrationPaths = fs.readdirSync(migrationsRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => path.join(migrationsRoot, entry.name, 'migration.sql'))
  .filter(file => fs.existsSync(file))
  .sort();
const lockPath = path.join(migrationsRoot, 'migration_lock.toml');

const schema = fs.readFileSync(schemaPath, 'utf8');
const migration = migrationPaths.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const migrationLock = fs.readFileSync(lockPath, 'utf8');

const collect = (source, pattern) => [...source.matchAll(pattern)].map(match => match[1]).sort();

test('migration history covers every Prisma model and enum exactly once', () => {
  const schemaModels = collect(schema, /^model\s+(\w+)\s*\{/gm);
  const schemaEnums = collect(schema, /^enum\s+(\w+)\s*\{/gm);
  const migrationTables = collect(migration, /^CREATE TABLE "([^"]+)"/gm);
  const migrationEnums = collect(migration, /^CREATE TYPE "([^"]+)" AS ENUM/gm);

  assert.deepEqual(migrationTables, schemaModels);
  assert.deepEqual(migrationEnums, schemaEnums);
  assert.equal(new Set(migrationTables).size, migrationTables.length);
  assert.equal(new Set(migrationEnums).size, migrationEnums.length);
});

test('migration history is structurally complete and explicit transactions close', () => {
  assert.ok(migrationPaths.length >= 2, 'Expected an ordered Prisma migration history.');
  for (const migrationPath of migrationPaths) {
    const sql = fs.readFileSync(migrationPath, 'utf8').trim();
    assert.ok(sql.length > 0, `${migrationPath} is empty.`);
    if (/^BEGIN;/m.test(sql)) assert.match(sql, /^COMMIT;/m, `${migrationPath} opens a transaction without closing it.`);
  }

  const tableBlocks = [...migration.matchAll(/^CREATE TABLE "([^"]+)" \(([\s\S]*?)^\);/gm)];
  assert.ok(tableBlocks.length > 0, 'No table definitions were found.');
  for (const [, table, body] of tableBlocks) {
    assert.match(body, /PRIMARY KEY/, `${table} does not declare a primary key.`);
  }

  assert.match(migration, /ADD CONSTRAINT .* FOREIGN KEY/m);
  assert.match(migration, /CREATE UNIQUE INDEX/m);
  assert.match(migrationLock, /provider\s*=\s*"postgresql"/);
});

test('schema contains only active persistence models and indexed query paths', () => {
  for (const retired of ['LoyaltyAccount', 'AssetObject', 'IdempotencyKey']) {
    assert.doesNotMatch(schema, new RegExp(`model\\s+${retired}\\b`));
    assert.doesNotMatch(migration, new RegExp(`CREATE TABLE "${retired}"`));
  }
  for (const retiredColumn of ['accessToken String', 'refreshToken String', 'tokenExpiresAt']) {
    assert.ok(!schema.includes(retiredColumn));
    assert.ok(!migration.includes(retiredColumn));
  }

  const schemaIndexes = collect(schema, /^\s*@@index\(\[([^\]]+)\]\)/gm);
  const migrationIndexes = collect(migration, /^CREATE INDEX "([^"]+)"/gm);
  assert.equal(migrationIndexes.length, schemaIndexes.length, 'Migration index count differs from the Prisma schema.');
  assert.ok(migrationIndexes.length >= 10, 'Expected indexes for active read and reconciliation paths.');
});
