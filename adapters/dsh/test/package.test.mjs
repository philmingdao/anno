import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { install } from '../dist/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('declares an installable DSH bundle backed by the official MCP client', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(manifest.name, '@philmingdao/anno-dsh');
  assert.equal(manifest.private, undefined);
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml');
  const patch = await readFile(path.join(root, 'cordis.patch.yml'), 'utf8');
  assert.match(patch, /@deepseek-ai\/dsh-mcp-client/);
  assert.match(patch, /serverName: anno/);
  assert.match(patch, /@philmingdao\/anno@0\.4\.0/);
});

test('ships the synchronized Anno skill and its referenced contract', async () => {
  const skill = await readFile(path.join(root, 'skills', 'review-html-artifacts', 'SKILL.md'), 'utf8');
  const contract = await readFile(path.join(root, 'skills', 'review-html-artifacts', 'references', 'session-contract.md'), 'utf8');
  assert.match(skill, /name: review-html-artifacts/);
  assert.match(skill, /html_review_start_session/);
  assert.match(contract, /session/i);
});

test('dry-run install validates profile names without touching DSH_HOME', async () => {
  const dshHome = await mkdtemp(path.join(tmpdir(), 'anno-dsh-dry-'));
  const changes = await install({ dshHome, dryRun: true, skipDoctor: true, packageSpec: root });
  assert.equal(changes[0].action, 'command');
  assert.equal(changes[1].action, 'created');
  await assert.rejects(
    () => install({ dshHome, profile: '../bad', dryRun: true, skipDoctor: true }),
    /profile names/,
  );
});

test('CLI exposes version and lifecycle commands', () => {
  const version = spawnSync(process.execPath, [path.join(root, 'dist', 'cli.js'), '--version'], { encoding: 'utf8' });
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), '0.1.0');
  const help = spawnSync(process.execPath, [path.join(root, 'dist', 'cli.js'), '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /anno-dsh install/);
  assert.match(help.stdout, /anno-dsh doctor/);
  assert.match(help.stdout, /anno-dsh uninstall/);
});
