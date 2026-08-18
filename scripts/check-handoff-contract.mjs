import fs from 'node:fs';

const requiredFiles = [
  'ai-context.json',
  'llms.txt',
  'docs/ARCHITECTURE.md',
  'docs/DATA_CONTRACT.md',
  'docs/UI_RULES.md',
  'docs/PROJECT_STATUS.md',
  'docs/MAJOR_CHANGE_HANDOFF.md',
  'docs/WEATHER_EXTRACTION_RUNBOOK.md',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing handoff file: ${file}`);
}

const context = JSON.parse(fs.readFileSync('ai-context.json', 'utf8'));
if (context?.starter?.entrypoint !== 'https://raw.githubusercontent.com/S-e-cmd/app-starter-template/main/START_HERE.md') {
  throw new Error('ai-context.json must reference the current parent START_HERE.md entrypoint');
}
for (const mode of ['create-new', 'align-existing', 'transform-existing']) {
  if (!context?.starter?.workModes?.includes(mode)) {
    throw new Error(`ai-context.json is missing starter work mode: ${mode}`);
  }
}
if (context?.publicSafety?.doNotCopyRepositoryInternalContextWithoutFiltering !== true) {
  throw new Error('ai-context.json must keep public handoff filtering enabled');
}
if (!Array.isArray(context?.publicSafety?.allowedCategories) || context.publicSafety.allowedCategories.length === 0) {
  throw new Error('ai-context.json must declare public-safe allowed categories');
}
if (context?.handoff?.readStarterEntrypointFirst !== true) {
  throw new Error('ai-context.json must require the current parent starter entrypoint');
}
if (context?.docs?.majorChangeHandoff !== 'docs/MAJOR_CHANGE_HANDOFF.md') {
  throw new Error('ai-context.json must reference docs/MAJOR_CHANGE_HANDOFF.md');
}
if (context?.docs?.weatherExtractionRunbook !== 'docs/WEATHER_EXTRACTION_RUNBOOK.md') {
  throw new Error('ai-context.json must reference docs/WEATHER_EXTRACTION_RUNBOOK.md');
}
if (context?.handoff?.recheckParentMajorChangePlanningBeforeMajorArchitectureOrTransitionWork !== true) {
  throw new Error('ai-context.json must require latest parent re-check before major change');
}

const llms = fs.readFileSync('llms.txt', 'utf8');
for (const marker of ['START_HERE.md', 'MAJOR_CHANGE_PLANNING.md', 'PROTOCOL_ROUTING_RULES.md']) {
  if (!llms.includes(marker)) throw new Error(`llms.txt is missing parent starter marker: ${marker}`);
}

const major = fs.readFileSync('docs/MAJOR_CHANGE_HANDOFF.md', 'utf8');
for (const marker of ['/api', 'LocalStorage', 'Cloudflare Pages', 'GAS', 'major-change-planning-required']) {
  if (!major.includes(marker)) throw new Error(`Major-change handoff is missing protected-boundary marker: ${marker}`);
}

const runbook = fs.readFileSync('docs/WEATHER_EXTRACTION_RUNBOOK.md', 'utf8');
for (const marker of [
  'npm test',
  'maintenance:apply-weather-extraction',
  'rollback',
  '2026-07-19-v29',
  '20260808-01',
]) {
  if (!runbook.includes(marker)) throw new Error(`Weather extraction runbook is missing safety marker: ${marker}`);
}

const architecture = fs.readFileSync('docs/ARCHITECTURE.md', 'utf8');
const projectStatus = fs.readFileSync('docs/PROJECT_STATUS.md', 'utf8');
const currentBuild = context?.build;
if (typeof currentBuild !== 'string' || !currentBuild.trim()) {
  throw new Error('ai-context.json must contain the current client build marker');
}
for (const [name, source] of [
  ['docs/ARCHITECTURE.md', architecture],
  ['docs/PROJECT_STATUS.md', projectStatus],
]) {
  if (!source.includes(`Client build marker: \`${currentBuild}\``)) {
    throw new Error(`${name} must match ai-context.json build marker ${currentBuild}`);
  }
}

console.log('handoff contract: ok');
