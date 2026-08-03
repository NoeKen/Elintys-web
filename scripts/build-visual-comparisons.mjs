import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve('docs/design-qa/event-experience');
const mappings = [
  ['dashboard-desktop', 'dashboard-1538x1100'],
  ['dashboard-empty', 'dashboard-empty-1538x1100'],
  ['events-grid-desktop', 'events-grid-1538x1100'],
  ['events-list-desktop', 'events-list-1538x1100'],
  ['event-public-desktop', 'event-public-1538x1100'],
  ['event-workspace-desktop', 'event-workspace-1538x1100'],
  ['event-access-desktop', 'event-access-1538x1100'],
  ['loading-desktop', 'events-loading-1538x1100'],
  ['error-desktop', 'events-error-1538x1100'],
];

for (const [reference, implementation] of mappings) {
  const referencePath = path.join(root, 'references', `reference-${reference}.png`);
  const implementationPath = path.join(root, 'implementations', `${implementation}.png`);
  if (!fs.existsSync(referencePath) || !fs.existsSync(implementationPath)) continue;
  const left = await sharp(referencePath).resize(768, 550, { fit: 'contain', background: '#F9F9F6' }).png().toBuffer();
  const right = await sharp(implementationPath).resize(768, 550, { fit: 'contain', background: '#F9F9F6' }).png().toBuffer();
  await sharp({ create: { width: 1536, height: 550, channels: 3, background: '#F9F9F6' } })
    .composite([{ input: left, left: 0, top: 0 }, { input: right, left: 768, top: 0 }])
    .png()
    .toFile(path.join(root, 'comparisons', `comparison-${reference}.png`));
}
