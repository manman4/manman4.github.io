const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const csvPath = path.join(root, 'data', 'missing_numbers.csv');
const htmlPath = path.join(root, 'index.html');

const startMarker = '<!-- generated:oeis-card:start -->';
const endMarker = '<!-- generated:oeis-card:end -->';

function formatTimestamp(ts) {
  return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)} ${ts.slice(9, 11)}:${ts.slice(11, 13)}:${ts.slice(13, 15)} JST`;
}

function buildCardMarkup(numbers, updatedAt) {
  const numberMarkup = numbers
    .map((number, index) => (index === 0 ? `<span class="oeis-num">${number}</span>` : number))
    .join(', ');

  return [
    '      <div class="oeis-numbers">',
    `        ${numberMarkup}`,
    '      </div>',
    '      <div class="oeis-meta">',
    `        <div>Updated: <span>${updatedAt}</span></div>`,
    `        <div>Count: <span>${numbers.length}</span></div>`,
    '      </div>',
  ].join('\n');
}

const csv = fs.readFileSync(csvPath, 'utf8');
const latestLine = csv
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .at(-1);

if (!latestLine) {
  throw new Error('missing_numbers.csv does not contain any data rows');
}

const values = latestLine.split(',').map((value) => value.trim()).filter(Boolean);
const timestamp = values[0];
const numbers = values.slice(1);

if (!timestamp || numbers.length === 0) {
  throw new Error('latest CSV row must contain a timestamp followed by numbers');
}

const html = fs.readFileSync(htmlPath, 'utf8');
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker);

if (start === -1 || end === -1 || end < start) {
  throw new Error('could not find generated oeis-card markers in index.html');
}

const replacement = `${startMarker}\n${buildCardMarkup(numbers, formatTimestamp(timestamp))}\n      ${endMarker}`;
const updatedHtml = html.slice(0, start) + replacement + html.slice(end + endMarker.length);

fs.writeFileSync(htmlPath, updatedHtml);
console.log(`Updated index.html from ${path.relative(root, csvPath)} using timestamp ${timestamp}`);
