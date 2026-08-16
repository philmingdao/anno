#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

const [requestPath, outputPath] = process.argv.slice(2);
const request = JSON.parse(await readFile(requestPath, 'utf8'));
const draft = await readFile(request.draft_html_path, 'utf8');
await writeFile(outputPath, draft.replace('</body>', '<!-- model-applied -->\n</body>'), 'utf8');
