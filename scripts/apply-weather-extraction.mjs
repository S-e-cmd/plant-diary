import { readFile, writeFile } from 'node:fs/promises';
import { transformWeatherExtraction } from './weather-extraction-transform.mjs';

const indexUrl=new URL('../index.html',import.meta.url);
const html=await readFile(indexUrl,'utf8');
const transformed=transformWeatherExtraction(html);

await writeFile(indexUrl,transformed,'utf8');
console.log('ok - weather extraction applied to index.html');
