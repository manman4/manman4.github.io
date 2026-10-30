import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import * as path from 'node:path';

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'dist');

// dist is generated output; remove stale files before preparing the public artifact.
rmSync(output, { recursive: true, force: true });
mkdirSync(path.join(output, 'data'), { recursive: true });
for (const file of [
  'index.html',
  'style.css',
  'robots.txt',
  'sitemap.xml',
  'googled59c89bc94493d5d.html',
  'data/missing_numbers.csv',
  'data/sloanes_gap.png',
]) {
  copyFileSync(path.join(root, file), path.join(output, file));
}
copyFileSync(path.join(root, 'build/src/main.js'), path.join(output, 'main.js'));
console.log('Built static site in dist/');
