import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

test('starts a Cursor review session and exposes a portable host-neutral handoff', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'anno-'));
  const source = path.join(root, 'sample.html');
  const sourceHtml = '<!doctype html><html><head><title>Sample</title></head><body><main><h1>Hello</h1><p>Original text</p><a href="#target"><span>Linked text</span></a><span id="target">Target</span></main></body></html>';
  await writeFile(source, sourceHtml, 'utf8');
  const env = Object.fromEntries(Object.entries(process.env).filter(([, value]) => typeof value === 'string'));
  env.HTML_REVIEW_STUDIO_HOME = path.join(root, 'state');
  env.ANNO_HOST = 'cursor';
  delete env.CODEX_THREAD_ID;
  delete env.CODEX_SESSION_ID;
  env.ANNO_DISABLE_CODEX_FALLBACK = '1';
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.resolve('dist/index.js')],
    cwd: process.cwd(),
    env,
    stderr: 'pipe'
  });
  const client = new Client({ name: 'anno-test', version: '1.0.0' });
  try {
    await client.connect(transport);
    const listed = await client.listTools();
    assert.deepEqual(listed.tools.map(tool => tool.name).sort(), [
      'html_review_claim_handoff',
      'html_review_get_session',
      'html_review_list_sessions',
      'html_review_mark_handoff_sent',
      'html_review_register_final',
      'html_review_start_session'
    ]);
    assert.equal(listed.tools.find(tool => tool.name === 'html_review_start_session')._meta.ui.resourceUri, 'ui://anno/review-handoff-v2.html');
    const resources = await client.listResources();
    assert.ok(resources.resources.some(resource => resource.uri === 'ui://anno/review-handoff-v2.html'));
    const widget = await client.readResource({ uri: 'ui://anno/review-handoff-v2.html' });
    assert.match(widget.contents[0].text, /ui\/message/);
    assert.match(widget.contents[0].text, /html_review_claim_handoff/);
    assert.match(widget.contents[0].mimeType, /text\/html;profile=mcp-app/);
    const started = await client.callTool({ name: 'html_review_start_session', arguments: { source_path: source } });
    assert.equal(started.isError, undefined);
    const details = started.structuredContent;
    assert.equal(typeof details.session_id, 'string');
    assert.match(details.review_url, /^http:\/\/127\.0\.0\.1:\d+\/session\//);
    const editorResponse = await fetch(details.review_url);
    assert.equal(editorResponse.status, 200);
    const editor = await editorResponse.text();
    assert.match(editor, /Anno/);
    assert.match(editor, /<svg class="wordmark"/);
    assert.doesNotMatch(editor, /<div class="wordmark"/);
    assert.match(editor, /id="language"/);
    assert.match(editor, /id="theme-toggle"/);
    assert.match(editor, /'zh-CN':\{/);
    assert.match(editor, /en:\{connecting:'Connecting'/);
    assert.match(editor, /localStorage\.setItem\('anno\.theme'/);
    assert.doesNotMatch(editor, /id="original"/);
    assert.doesNotMatch(editor, /id="current"/);
    assert.doesNotMatch(editor, /<div class="position-hint"/);
    assert.match(editor, /width:14px;height:14px/);
    assert.match(editor, /border:1px dashed rgba\(0,0,0,\.2\)/);
    assert.match(editor, /\[data-review-key\]\[data-review-selected="true"\]/);
    assert.match(editor, /function inlineEditItems\(\)/);
    assert.match(editor, /function buildColorPalette\(\)/);
    assert.match(editor, /function collectAppliedColors\(element\)/);
    assert.match(editor, /doc\.body\.querySelectorAll\('\*'\)/);
    assert.match(editor, /!element\.closest\('\.anno-review-ui'\)/);
    assert.match(editor, /border\$\{side\}Style/);
    assert.match(editor, /const legacySelector=/);
    assert.match(editor, /localSpans=/);
    assert.match(editor, /suppressLinkActivation/);
    assert.match(editor, /a\[href\].*:has\(\[data-review-key\]\)/);
    assert.match(editor, /function syncAreaMarkerVisibility\(\)/);
    assert.match(editor, /function setupPageTracking\(\)/);
    assert.match(editor, /IntersectionObserver/);
    assert.match(editor, /marker\.dataset\.annotationPage/);
    assert.match(editor, /\.anno-area-marker\[hidden\]/);
    assert.match(editor, /id="document-colors"/);
    assert.match(editor, /\.slice\(0,7\)/);
    assert.match(editor, /<input[^>]+type="color"/);
    assert.match(editor, /<button type="button">保存<\/button>/);
    assert.match(editor, /ResizeObserver/);
    const token = editor.match(/TOKEN='([0-9a-f]+)'/)?.[1];
    assert.ok(token);
    const finalizedHtml = sourceHtml.replace('Original text', 'Revised text');
    const finalizeResponse = await fetch(`${details.review_url.replace(/\/session\/[0-9a-f-]+\/$/, '')}/api/session/${details.session_id}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Review-Token': token },
      body: JSON.stringify({
        html: finalizedHtml,
        review: { edits: { 'p1-e2': 'Revised text' }, formatChanges: {}, annotations: [], pageNotes: {}, activePage: 1 }
      })
    });
    assert.equal(finalizeResponse.status, 200);
    const finalized = await finalizeResponse.json();
    assert.equal(finalized.session.status, 'generated');
    assert.equal((await stat(finalized.output_path)).isFile(), true);
    assert.match(await readFile(finalized.output_path, 'utf8'), /Revised text/);
    assert.equal(await readFile(source, 'utf8'), sourceHtml);
    const session = await client.callTool({ name: 'html_review_get_session', arguments: { session_id: details.session_id } });
    assert.equal(session.structuredContent.session.status, 'generated');
    assert.equal(session.structuredContent.session.edit_count, 1);

    const generateResponse = await fetch(`${details.review_url.replace(/\/session\/[0-9a-f-]+\/$/, '')}/api/session/${details.session_id}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Review-Token': token },
      body: JSON.stringify({
        html: finalizedHtml,
        review: {
          edits: { 'p1-e2': 'Revised text' },
          formatChanges: { 'p1-e1': { 'container.translate': '12px 4px' } },
          annotations: [{
            id: 'area-test', key: 'area-test', page: 1, originalText: 'Hello', currentText: 'Hello', note: 'Make this clearer', resolved: false,
            createdAt: new Date().toISOString(), kind: 'area', targetKeys: ['p1-e1'], rect: { x: 10, y: 20, width: 100, height: 60 }
          }],
          pageNotes: {}, activePage: 1
        }
      })
    });
    assert.equal(generateResponse.status, 202);
    const generation = await generateResponse.json();
    assert.equal(generation.handoff_ready, true);
    assert.equal(generation.session.status, 'needs_agent');
    assert.equal(generation.session.handoff.status, 'pending');
    assert.equal(generation.session.handoff.host, 'cursor');
    assert.equal(generation.session.handoff.has_host_target, false);
    assert.match(await readFile(generation.draft_html_path, 'utf8'), /Revised text/);
    const request = JSON.parse(await readFile(generation.generation_request_path, 'utf8'));
    assert.equal(request.session_id, details.session_id);
    assert.equal(request.handoff_id, generation.session.handoff.id);
    assert.equal(request.annotations[0].note, 'Make this clearer');
    const handedOff = await client.callTool({ name: 'html_review_get_session', arguments: { session_id: details.session_id } });
    assert.equal(handedOff.structuredContent.session.status, 'needs_agent');
    assert.equal(handedOff.structuredContent.session.draft_html_path, generation.draft_html_path);
    assert.equal(handedOff.structuredContent.review.annotations[0].resolved, false);
    const sent = await client.callTool({ name: 'html_review_mark_handoff_sent', arguments: { session_id: details.session_id, handoff_id: generation.session.handoff.id } });
    assert.equal(sent.structuredContent.status, 'sent');
    const claimed = await client.callTool({ name: 'html_review_claim_handoff', arguments: { session_id: details.session_id, handoff_id: generation.session.handoff.id } });
    assert.equal(claimed.structuredContent.status, 'claimed');
    const claimedAgain = await client.callTool({ name: 'html_review_claim_handoff', arguments: { session_id: details.session_id, handoff_id: generation.session.handoff.id } });
    assert.equal(claimedAgain.structuredContent.claimed_at, claimed.structuredContent.claimed_at);
    const staleClaim = await client.callTool({ name: 'html_review_claim_handoff', arguments: { session_id: details.session_id, handoff_id: crypto.randomUUID() } });
    assert.equal(staleClaim.isError, true);
  } finally {
    await client.close();
  }
});

test('falls back to the captured Codex task when no widget sends the handoff', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'anno-fallback-'));
  const source = path.join(root, 'sample.html');
  const log = path.join(root, 'codex-call.json');
  const fakeCodex = path.join(root, 'codex-fake.mjs');
  await writeFile(source, '<!doctype html><html><body><p>Hello</p></body></html>', 'utf8');
  await writeFile(fakeCodex, `#!/usr/bin/env node\nimport { writeFileSync } from 'node:fs';\nwriteFileSync(process.env.ANNO_FAKE_LOG, JSON.stringify(process.argv.slice(2)));\n`, 'utf8');
  await chmod(fakeCodex, 0o755);
  const env = Object.fromEntries(Object.entries(process.env).filter(([, value]) => typeof value === 'string'));
  env.HTML_REVIEW_STUDIO_HOME = path.join(root, 'state');
  env.CODEX_THREAD_ID = '11111111-1111-4111-8111-111111111111';
  env.ANNO_HANDOFF_FALLBACK_MS = '100';
  env.ANNO_CODEX_EXECUTABLE = process.execPath;
  env.ANNO_CODEX_EXECUTABLE_ARGS = JSON.stringify([fakeCodex]);
  env.ANNO_FAKE_LOG = log;
  delete env.ANNO_DISABLE_CODEX_FALLBACK;
  const transport = new StdioClientTransport({ command: process.execPath, args: [path.resolve('dist/index.js')], cwd: process.cwd(), env, stderr: 'pipe' });
  const client = new Client({ name: 'anno-fallback-test', version: '1.0.0' });
  try {
    await client.connect(transport);
    const started = await client.callTool({ name: 'html_review_start_session', arguments: { source_path: source } });
    const editor = await (await fetch(started.structuredContent.review_url)).text();
    const token = editor.match(/TOKEN='([0-9a-f]+)'/)?.[1];
    const base = started.structuredContent.review_url.replace(/\/session\/[0-9a-f-]+\/$/, '');
    const response = await fetch(`${base}/api/session/${started.structuredContent.session_id}/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Review-Token': token },
      body: JSON.stringify({ html: '<!doctype html><html><body><p>Hello</p></body></html>', review: { edits: {}, formatChanges: {}, annotations: [], pageNotes: { '1': 'Tighten copy' }, activePage: 1 } })
    });
    assert.equal(response.status, 202);
    let state;
    for (let attempt = 0; attempt < 50; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      state = (await client.callTool({ name: 'html_review_get_session', arguments: { session_id: started.structuredContent.session_id } })).structuredContent.session;
      if (state.handoff.status === 'sent') break;
    }
    assert.equal(state.handoff.status, 'sent');
    assert.equal(state.handoff.attempts, 1);
    const args = JSON.parse(await readFile(log, 'utf8'));
    assert.deepEqual(args.slice(0, 4), ['exec', 'resume', '--skip-git-repo-check', env.CODEX_THREAD_ID]);
    assert.match(args[4], /html_review_claim_handoff/);
  } finally {
    await client.close();
  }
});

test('recovers an undelivered handoff after the MCP server restarts', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'anno-restart-'));
  const source = path.join(root, 'sample.html');
  const stateRoot = path.join(root, 'state');
  const log = path.join(root, 'codex-call.json');
  const fakeCodex = path.join(root, 'codex-fake.mjs');
  await writeFile(source, '<!doctype html><html><body><p>Restart</p></body></html>', 'utf8');
  await writeFile(fakeCodex, `#!/usr/bin/env node\nimport { writeFileSync } from 'node:fs';\nwriteFileSync(process.env.ANNO_FAKE_LOG, JSON.stringify(process.argv.slice(2)));\n`, 'utf8');
  await chmod(fakeCodex, 0o755);
  const baseEnv = Object.fromEntries(Object.entries(process.env).filter(([, value]) => typeof value === 'string'));
  Object.assign(baseEnv, { HTML_REVIEW_STUDIO_HOME: stateRoot, CODEX_THREAD_ID: '22222222-2222-4222-8222-222222222222', ANNO_DISABLE_CODEX_FALLBACK: '1' });
  const firstTransport = new StdioClientTransport({ command: process.execPath, args: [path.resolve('dist/index.js')], cwd: process.cwd(), env: baseEnv, stderr: 'pipe' });
  const firstClient = new Client({ name: 'anno-before-restart', version: '1.0.0' });
  let sessionId;
  try {
    await firstClient.connect(firstTransport);
    const started = await firstClient.callTool({ name: 'html_review_start_session', arguments: { source_path: source } });
    sessionId = started.structuredContent.session_id;
    const editor = await (await fetch(started.structuredContent.review_url)).text();
    const token = editor.match(/TOKEN='([0-9a-f]+)'/)?.[1];
    const base = started.structuredContent.review_url.replace(/\/session\/[0-9a-f-]+\/$/, '');
    await fetch(`${base}/api/session/${sessionId}/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Review-Token': token }, body: JSON.stringify({ html: '<!doctype html><html><body><p>Restart</p></body></html>', review: { edits: {}, formatChanges: {}, annotations: [], pageNotes: { '1': 'Recover me' }, activePage: 1 } }) });
  } finally { await firstClient.close(); }

  const recoveryEnv = {
    ...baseEnv,
    ANNO_HANDOFF_FALLBACK_MS: '100',
    ANNO_CODEX_EXECUTABLE: process.execPath,
    ANNO_CODEX_EXECUTABLE_ARGS: JSON.stringify([fakeCodex]),
    ANNO_FAKE_LOG: log
  };
  delete recoveryEnv.ANNO_DISABLE_CODEX_FALLBACK;
  const recoveryTransport = new StdioClientTransport({ command: process.execPath, args: [path.resolve('dist/index.js')], cwd: process.cwd(), env: recoveryEnv, stderr: 'pipe' });
  const recoveryClient = new Client({ name: 'anno-after-restart', version: '1.0.0' });
  try {
    await recoveryClient.connect(recoveryTransport);
    let session;
    for (let attempt = 0; attempt < 50; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      session = (await recoveryClient.callTool({ name: 'html_review_get_session', arguments: { session_id: sessionId } })).structuredContent.session;
      if (session.handoff.status === 'sent') break;
    }
    assert.equal(session.handoff.status, 'sent');
    assert.equal(session.handoff.attempts, 1);
    assert.match((await readFile(log, 'utf8')), new RegExp(sessionId));
  } finally { await recoveryClient.close(); }
});
