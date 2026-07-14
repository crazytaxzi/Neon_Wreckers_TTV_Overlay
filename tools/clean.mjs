import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const removableDirectories = new Set(['dist', 'coverage']);
const removableSuffixes = ['.tsbuildinfo'];
let removed = 0;

function clean(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'backups') continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (removableDirectories.has(entry.name)) {
        fs.rmSync(target, { recursive: true, force: true });
        removed += 1;
      } else {
        clean(target);
      }
    } else if (removableSuffixes.some(suffix => entry.name.endsWith(suffix))) {
      fs.rmSync(target, { force: true });
      removed += 1;
    }
  }
}

clean(root);
console.log(`Cleaned ${removed} generated path${removed === 1 ? '' : 's'}.`);
