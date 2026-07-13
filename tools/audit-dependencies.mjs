import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const rootManifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const dependencyGuide = fs.readFileSync(path.join(root, 'docs/DEPENDENCY_AUDIT.md'), 'utf8');
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);
const importPattern = /(?:\bimport\s+(?:[^'"()]*?\s+from\s+)?|\bexport\s+[^'"()]*?\s+from\s+|\brequire\s*\(|\bimport\s*\()\s*['"]([^'"]+)['"]/g;

function workspaceDirectories(pattern) {
  if (!pattern.endsWith('/*')) return [pattern];
  const parent = pattern.slice(0, -2);
  return fs.readdirSync(path.join(root, parent), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(root, parent, entry.name, 'package.json')))
    .map(entry => `${parent}/${entry.name}`);
}

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['dist', 'coverage', 'node_modules'].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(target));
    else if (sourceExtensions.has(path.extname(entry.name))) files.push(target);
  }
  return files;
}

function packageName(specifier) {
  if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('node:')) return null;
  if (specifier.startsWith('@')) return specifier.split('/').slice(0, 2).join('/');
  return specifier.split('/')[0];
}

const errors = [];
const workspaces = rootManifest.workspaces.flatMap(workspaceDirectories).sort();
let auditedDependencies = 0;

for (const directory of workspaces) {
  const manifestPath = path.join(root, directory, 'package.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const declared = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {})
  ]);
  const used = new Set();

  for (const file of walk(path.join(root, directory))) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(importPattern)) {
      const dependency = packageName(match[1]);
      if (dependency) used.add(dependency);
    }
  }

  for (const dependency of used) {
    if (!declared.has(dependency)) errors.push(`${manifest.name} imports undeclared dependency ${dependency}.`);
  }
  for (const dependency of declared) {
    auditedDependencies += 1;
    if (!used.has(dependency) && !dependency.startsWith('@types/')) {
      errors.push(`${manifest.name} declares unused dependency ${dependency}.`);
    }
  }

  for (const [dependency, version] of Object.entries({ ...manifest.dependencies, ...manifest.devDependencies })) {
    if (/^[~^*]|\s|\|/.test(version)) errors.push(`${manifest.name} does not pin ${dependency} to an exact version.`);
  }
}

const allRootDependencies = {
  ...rootManifest.dependencies,
  ...rootManifest.devDependencies
};
for (const [dependency, version] of Object.entries(allRootDependencies)) {
  auditedDependencies += 1;
  if (/^[~^*]|\s|\|/.test(version)) errors.push(`Root manifest does not pin ${dependency} to an exact version.`);
  if (!dependencyGuide.includes(`\`${dependency}\``)) errors.push(`Dependency guide does not document ${dependency}.`);
}

for (const directory of workspaces) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, directory, 'package.json'), 'utf8'));
  for (const dependency of Object.keys(manifest.dependencies ?? {})) {
    if (!dependencyGuide.includes(`\`${dependency}\``) && !dependency.startsWith('@neon-wreckers/')) {
      errors.push(`Dependency guide does not document ${dependency}.`);
    }
  }
}

if (errors.length) {
  for (const error of errors) console.error(`Dependency audit: ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Dependency audit passed for ${workspaces.length} workspaces and ${auditedDependencies} declarations.`);
}
