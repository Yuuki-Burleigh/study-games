// Print generated problem instances as JSON, for tools/check_java.py (and for eyeballing).
// Usage: node tools/sample.mjs <deck.json> [count=20] [firstSeed=1]
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { instantiate } from '../gen-kit.js';

const [deckPath, count = '20', first = '1'] = process.argv.slice(2);
const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const deck = JSON.parse(readFileSync(resolve(deckPath), 'utf8'));
if (!deck.generators) { console.log('[]'); process.exit(0); }
const templates = (await import(pathToFileURL(resolve(root, deck.generators)).href)).default;
const out = [];
for (const t of templates) for (let s = Number(first); s < Number(first) + Number(count); s++) out.push(instantiate(t, s));
console.log(JSON.stringify(out));
