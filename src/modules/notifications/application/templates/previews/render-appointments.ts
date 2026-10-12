import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { render } from '@react-email/render';
import { appointmentPreviews } from './appointment.fixtures';

async function main() {
  const output = process.argv[2];
  if (!output) throw new Error('Pass an output directory for fictional email previews');
  const directory = resolve(output);
  await mkdir(directory, { recursive: true });
  for (const { name, content } of appointmentPreviews) {
    await writeFile(resolve(directory, `${name}.html`), await render(content));
    await writeFile(resolve(directory, `${name}.txt`), await render(content, { plainText: true }));
  }
  console.log(`Rendered ${appointmentPreviews.length} fictional appointment previews to ${directory}`);
}
void main();
