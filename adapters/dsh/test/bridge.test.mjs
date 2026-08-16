import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { apply } from '../dist/index.js';

test('maps the Anno MCP catalog into the DSH tool registry', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'anno-dsh-'));
  process.env.ANNO_DATA_DIR = path.join(root, 'state');
  const definitions = new Map();
  let cleanup = async () => {};
  const ctx = {
    tools: {
      register(definition) {
        definitions.set(definition.name, definition);
        return () => definitions.delete(definition.name);
      }
    },
    effect(factory) {
      cleanup = factory();
    }
  };

  apply(ctx);
  try {
    for (let attempt = 0; attempt < 100 && definitions.size < 6; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    assert.equal(definitions.size, 6);
    const source = path.join(root, 'sample.html');
    await writeFile(source, '<!doctype html><html><body><p>DSH</p></body></html>', 'utf8');
    const result = await definitions.get('html_review_start_session').execute({ source_path: source });
    assert.equal(result.isError, false);
    assert.match(result.text, /http:\/\/127\.0\.0\.1:/);
  } finally {
    await cleanup();
  }
});
