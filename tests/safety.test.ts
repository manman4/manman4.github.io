import { strict as assert } from 'node:assert';
import { execFileSync, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { test, type TestContext } from 'node:test';
import { runInNewContext } from 'node:vm';

const root = path.resolve(__dirname, '../..');
const originalHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const browserScript = fs.readFileSync(path.join(root, 'dist/main.js'), 'utf8');

function fixture(t: TestContext): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'site-safety-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, 'build/scripts'), { recursive: true });
  fs.mkdirSync(path.join(directory, 'data'));
  fs.copyFileSync(path.join(root, 'build/scripts/update_oeis_card.js'),
    path.join(directory, 'build/scripts/update_oeis_card.js'));
  fs.writeFileSync(path.join(directory, 'index.html'), originalHtml);
  return directory;
}

class Element {
  style: Record<string, string> = {};
  children: Element[] = [];
  textContent = '';
  appendChild(child: Element): void { this.children.push(child); }
  append(...children: Element[]): void { this.children.push(...children); }
  replaceChildren(...children: Element[]): void { this.children = children; }
}

async function render(csv: string, options: { ok?: boolean; offline?: boolean; missing?: boolean } = {}): Promise<Element> {
  const card = new Element();
  card.textContent = 'Static fallback';
  await runInNewContext(browserScript, {
    fetch: () => options.offline ? Promise.reject(new Error('offline')) :
      Promise.resolve({ ok: options.ok ?? true, text: () => Promise.resolve(csv) }),
    document: {
      getElementById: () => options.missing ? null : card,
      createElement: () => new Element(),
      createTextNode: (text: string) => Object.assign(new Element(), { textContent: text }),
    },
  });
  return card;
}

test('browser script runs without Node globals and renders the latest CSV row', async () => {
  const card = await render('20260101_000000,1\r\n20261030_123456,2,3\r\n');
  assert.equal(card.children[0]?.children[0]?.textContent, '2');
  assert.equal(card.children[0]?.children[2]?.textContent, '3');
  assert.equal(card.children[1]?.children[0]?.children[0]?.textContent, '2026-10-30 12:34:56 JST');
  assert.equal(card.children[1]?.children[1]?.children[0]?.textContent, '2');
  await render('20261030_123456,2', { missing: true });
});

test('HTTP errors, network failures and malformed data preserve the static fallback', async () => {
  for (const [csv, options] of [
    ['20261030_123456,2', { ok: false }],
    ['', { offline: true }],
    ['', {}],
    ['<html>Error</html>', {}],
    ['20261030_123456,<img src=x onerror=alert(1)>', {}],
    ['20261030_123456,2,,3', {}],
  ] as const) {
    const card = await render(csv, options);
    assert.equal(card.textContent, 'Static fallback');
    assert.equal(card.children.length, 0);
  }
});

test('updater rejects unsafe CSV and ambiguous markers without changing HTML', t => {
  const directory = fixture(t);
  const htmlPath = path.join(directory, 'index.html');
  const csvPath = path.join(directory, 'data/missing_numbers.csv');
  const script = path.join(directory, 'build/scripts/update_oeis_card.js');
  for (const csv of ['', 'invalid,2', '20261030_123456,<script>alert(1)</script>',
    '20261030_123456,1,,2', '20261030_123456,0']) {
    fs.writeFileSync(csvPath, csv);
    assert.notEqual(spawnSync(process.execPath, [script]).status, 0);
    assert.equal(fs.readFileSync(htmlPath, 'utf8'), originalHtml);
  }
  fs.writeFileSync(csvPath, '20261030_123456,2,3\n');
  for (const html of [originalHtml.replace('<!-- generated:oeis-card:end -->', ''),
    originalHtml + '<!-- generated:oeis-card:start -->']) {
    fs.writeFileSync(htmlPath, html);
    assert.notEqual(spawnSync(process.execPath, [script]).status, 0);
    assert.equal(fs.readFileSync(htmlPath, 'utf8'), html);
  }
  fs.writeFileSync(htmlPath, originalHtml);
  execFileSync(process.execPath, [script]);
  const updated = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(updated.includes('2026-10-30 12:34:56 JST'));
  assert.ok(updated.includes('Count: <span>2</span>'));
  const withoutCard = (html: string) => html.replace(
    /<!-- generated:oeis-card:start -->[\s\S]*?<!-- generated:oeis-card:end -->/, 'CARD');
  assert.equal(withoutCard(updated), withoutCard(originalHtml));
  assert.ok(!fs.readdirSync(directory).some(name => name.startsWith('.update-card-')));
});

test('build publishes only approved assets and removes stale output', t => {
  const directory = fixture(t);
  const assets = ['index.html', 'style.css', 'robots.txt', 'sitemap.xml',
    'googled59c89bc94493d5d.html', 'data/missing_numbers.csv', 'data/sloanes_gap.png'];
  for (const file of assets) fs.copyFileSync(path.join(root, file), path.join(directory, file));
  fs.mkdirSync(path.join(directory, 'build/src'));
  fs.copyFileSync(path.join(root, 'build/src/main.js'), path.join(directory, 'build/src/main.js'));
  fs.copyFileSync(path.join(root, 'build/scripts/build.js'), path.join(directory, 'build/scripts/build.js'));
  fs.mkdirSync(path.join(directory, 'dist'));
  fs.writeFileSync(path.join(directory, 'dist/stale.txt'), 'old output');
  fs.writeFileSync(path.join(directory, 'data/unpublished.txt'), 'private fixture');
  execFileSync(process.execPath, [path.join(directory, 'build/scripts/build.js')]);
  assert.equal(fs.existsSync(path.join(directory, 'dist/stale.txt')), false);
  assert.equal(fs.existsSync(path.join(directory, 'dist/data/unpublished.txt')), false);
  for (const file of assets) assert.deepEqual(
    fs.readFileSync(path.join(directory, 'dist', file)), fs.readFileSync(path.join(root, file)));
  assert.equal(fs.readFileSync(path.join(directory, 'dist/main.js'), 'utf8'), browserScript);
});
