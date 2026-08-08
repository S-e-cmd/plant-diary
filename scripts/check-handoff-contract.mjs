import fs from 'node:fs';

const requiredFiles = [
  'ai-context.json',
  'llms.txt',
  'docs/ARCHITECTURE.md',
  'docs/DATA_CONTRACT.md',
  'docs/UI_RULES.md',
  'docs/PROJECT_STATUS.md',
  'docs/MAJOR_CHANGE_HANDOFF.md',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing handoff file: ${file}`);
}

const context = JSON.parse(fs.readFileSync('ai-context.json', 'utf8'));
if (context?.docs?.majorChangeHandoff !== 'docs/MAJOR_CHANGE_HANDOFF.md') {
  throw new Error('ai-context.json must reference docs/MAJOR_CHANGE_HANDOFF.md');
}
if (context?.handoff?.recheckLatestParentBeforeMajorChange !== true) {
  throw new Error('ai-context.json must require latest parent re-check before major change');
}

const llms = fs.readFileSync('llms.txt', 'utf8');
for (const marker of ['MAJOR_CHANGE_PLANNING.md', 'PROTOCOL_ROUTING_RULES.md']) {
  if (!llms.includes(marker)) throw new Error(`llms.txt is missing parent starter marker: ${marker}`);
}

const major = fs.readFileSync('docs/MAJOR_CHANGE_HANDOFF.md', 'utf8');
for (const marker of ['/api', 'LocalStorage', 'Cloudflare Pages', 'GAS', 'major-change-planning-required']) {
  if (!major.includes(marker)) throw new Error(`Major-change handoff is missing protected-boundary marker: ${marker}`);
}

console.log('handoff contract: ok');
