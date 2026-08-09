import { readFile, writeFile } from 'node:fs/promises';
import { transformLogDateExtraction } from './log-date-extraction-transform.mjs';

const url = new URL('../index.html', import.meta.url);
const source = await readFile(url, 'utf8');
const transformed = transformLogDateExtraction(source);
await writeFile(url, transformed, 'utf8');
console.log('log date extraction applied');
