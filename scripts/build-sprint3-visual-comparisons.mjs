import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const existingRoot = path.resolve('docs/design-qa/event-experience');
const sprintRoot = path.resolve('docs/design-qa/sprint-3-wave-1');
const references = path.join(sprintRoot, 'references');
const implementations = path.join(sprintRoot, 'implementations');
const comparisons = path.join(sprintRoot, 'comparisons');

fs.mkdirSync(references, { recursive: true });
fs.mkdirSync(comparisons, { recursive: true });

const mappings = [
  {
    name: 'dashboard-desktop',
    reference: 'reference-dashboard-desktop.png',
    implementation: 'dashboard-1538x1100.png',
  },
  {
    name: 'events-grid-desktop',
    reference: 'reference-events-grid-desktop.png',
    implementation: 'events-grid-1538x1100.png',
  },
  {
    name: 'events-list-desktop',
    reference: 'reference-events-list-desktop.png',
    implementation: 'events-list-1538x1100.png',
  },
  {
    name: 'error-desktop',
    reference: 'reference-error-desktop.png',
    implementation: 'events-error-1440x900.png',
  },
];

for (const mapping of mappings) {
  const sourceReference = path.join(existingRoot, 'references', mapping.reference);
  const sprintReference = path.join(references, mapping.reference);
  if (!fs.existsSync(sprintReference)) fs.copyFileSync(sourceReference, sprintReference);

  const implementation = path.join(implementations, mapping.implementation);
  const left = await sharp(sprintReference)
    .resize(768, 550, { fit: 'contain', background: '#F9F9F6' })
    .png()
    .toBuffer();
  const right = await sharp(implementation)
    .resize(768, 550, { fit: 'contain', background: '#F9F9F6' })
    .png()
    .toBuffer();

  await sharp({ create: { width: 1536, height: 550, channels: 3, background: '#F9F9F6' } })
    .composite([{ input: left, left: 0, top: 0 }, { input: right, left: 768, top: 0 }])
    .png()
    .toFile(path.join(comparisons, `comparison-${mapping.name}.png`));
}
