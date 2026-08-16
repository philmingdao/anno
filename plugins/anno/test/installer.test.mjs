import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parse } from 'jsonc-parser';
import { doctor, setup, uninstall } from '../dist/installer.js';

const PACKAGE_ARGS = ['-y', '@philmingdao/anno@0.4.0', 'mcp'];

test('merges, verifies, repeats, and removes direct-host installs without losing JSONC', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'anno-installer-'));
  const home = path.join(root, 'home');
  const projectDir = path.join(root, 'project');
  t.after(() => rm(root, { recursive: true, force: true }));
  const cursorConfig = path.join(home, '.cursor', 'mcp.json');
  await mkdir(path.dirname(cursorConfig), { recursive: true });
  await writeFile(cursorConfig, '{\n  // keep this user comment\n  "mcpServers": {\n    "existing": { "command": "existing-tool" }\n  }\n}\n', 'utf8');

  const options = { hosts: ['cursor', 'windsurf', 'copilot'], scope: 'user', home, projectDir, skipDoctor: true };
  const first = await setup(options);
  assert.ok(first.some(change => change.host === 'cursor' && change.action === 'updated'));
  const cursorText = await readFile(cursorConfig, 'utf8');
  assert.match(cursorText, /keep this user comment/);
  const cursor = parse(cursorText);
  assert.equal(cursor.mcpServers.existing.command, 'existing-tool');
  assert.equal(cursor.mcpServers.anno.command, 'npx');
  assert.deepEqual(cursor.mcpServers.anno.args, PACKAGE_ARGS);
  assert.match(await readFile(path.join(home, '.cursor', 'skills', 'anno', 'SKILL.md'), 'utf8'), /review-html-artifacts/);
  assert.deepEqual(parse(await readFile(path.join(home, '.codeium', 'windsurf', 'mcp_config.json'), 'utf8')).mcpServers.anno.args, PACKAGE_ARGS);
  assert.deepEqual(parse(await readFile(path.join(home, '.copilot', 'mcp-config.json'), 'utf8')).mcpServers.anno.args, PACKAGE_ARGS);

  const second = await setup(options);
  assert.ok(second.every(change => change.action === 'unchanged'));
  await uninstall(options);
  const after = parse(await readFile(cursorConfig, 'utf8'));
  assert.equal(after.mcpServers.anno, undefined);
  assert.equal(after.mcpServers.existing.command, 'existing-tool');
  await assert.rejects(readFile(path.join(home, '.cursor', 'skills', 'anno', 'SKILL.md'), 'utf8'));
});

test('installs a complete native Antigravity bundle in user and project scopes', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'anno-antigravity-'));
  const home = path.join(root, 'home');
  const projectDir = path.join(root, 'project');
  t.after(() => rm(root, { recursive: true, force: true }));

  await setup({ hosts: ['antigravity'], scope: 'user', home, projectDir, skipDoctor: true });
  for (const pluginRoot of [
    path.join(home, '.gemini', 'config', 'plugins', 'anno'),
    path.join(home, '.gemini', 'antigravity-cli', 'plugins', 'anno'),
  ]) {
    assert.equal(JSON.parse(await readFile(path.join(pluginRoot, 'plugin.json'), 'utf8')).name, 'anno');
    assert.deepEqual(JSON.parse(await readFile(path.join(pluginRoot, 'mcp_config.json'), 'utf8')).mcpServers.anno.args, PACKAGE_ARGS);
    assert.match(await readFile(path.join(pluginRoot, 'skills', 'review-html-artifacts', 'SKILL.md'), 'utf8'), /review-html-artifacts/);
  }
  await setup({ hosts: ['antigravity'], scope: 'project', home, projectDir, skipDoctor: true });
  assert.equal(JSON.parse(await readFile(path.join(projectDir, '.agents', 'plugins', 'anno', 'plugin.json'), 'utf8')).name, 'anno');
});

test('doctor verifies installed files and a real MCP handshake', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'anno-doctor-test-'));
  const home = path.join(root, 'home');
  const projectDir = path.join(root, 'project');
  t.after(() => rm(root, { recursive: true, force: true }));
  await setup({ hosts: ['cursor', 'antigravity'], scope: 'user', home, projectDir, skipDoctor: true });
  const changes = await doctor({ hosts: ['cursor', 'antigravity'], scope: 'user', home, projectDir });
  assert.ok(changes.some(change => change.target === 'MCP initialize + tools/list'));
});

test('requires an explicit Muse Code config and supports a caller-confirmed path', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'anno-muse-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await assert.rejects(
    setup({ hosts: ['muse'], scope: 'user', home: root, skipDoctor: true }),
    /Muse Code support is experimental/,
  );
  const customConfig = path.join(root, 'muse', 'mcp.json');
  await setup({ hosts: ['muse'], scope: 'user', home: root, customConfig, skipDoctor: true });
  assert.deepEqual(parse(await readFile(customConfig, 'utf8')).mcpServers.anno.args, PACKAGE_ARGS);
});

test('ships a working anno CLI entry point', () => {
  const result = spawnSync(process.execPath, [path.resolve('dist/cli.js'), '--version'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), '0.4.0');
});
