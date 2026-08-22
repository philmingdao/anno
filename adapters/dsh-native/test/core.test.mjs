import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  countSlides,
  defaultOutputPath,
  createStore,
  createHttpServer
} from '../lib/anno-core.js';

const SAMPLE_HTML = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Sample</title></head>
<body>
  <section data-slide="1"><h1>Slide One</h1></section>
  <section data-slide="2"><h1>Slide Two</h1></section>
</body>
</html>`;

test('countSlides counts data-slide sections and falls back', () => {
  assert.equal(countSlides(SAMPLE_HTML), 2);
  assert.equal(countSlides('<html><body><p>hi</p></body></html>'), 1);
});

test('defaultOutputPath appends -reviewed', () => {
  assert.equal(defaultOutputPath('/tmp/foo.html'), path.join('/tmp', 'foo-reviewed.html'));
});

test('store: full session lifecycle (create -> handoff -> claim -> resolve)', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'anno-test-'));
  const store = createStore({ dataDir: dir, host: 'dsh' });
  await store.ensureReady();

  const source = path.join(dir, 'source.html');
  await writeFile(source, SAMPLE_HTML);

  const session = await store.createSession(source);
  assert.equal(session.status, 'editing');
  assert.equal(session.slideCount, 2);
  assert.match(session.id, /^[0-9a-f-]{36}$/);
  assert.ok(session.token.length > 0);
  assert.notEqual(session.outputTarget, source);

  // The source copy must exist and match.
  const copy = await readFile(session.sourceCopyPath, 'utf8');
  assert.equal(copy, SAMPLE_HTML);

  // Save a review with an unresolved annotation.
  const review = {
    edits: { a: 'edited' },
    formatChanges: { b: { color: '#000000' } },
    annotations: [{ id: 'ann-1', key: 'k1', page: 1, originalText: 'x', currentText: 'y', note: 'please fix', resolved: false, createdAt: new Date().toISOString() }],
    pageNotes: { '1': 'make it nicer' },
    activePage: 1
  };
  await store.saveReview(session.id, review);
  const loaded = await store.loadReview(session.id);
  assert.equal(loaded.edits.a, 'edited');
  assert.equal(loaded.annotations.length, 1);

  // Prepare an agent handoff.
  const draft = '<!doctype html><html><body><h1>draft</h1></body></html>';
  const handoff = await store.prepareAgentHandoff(session, draft, review);
  assert.ok(handoff.draftPath.endsWith('model-draft.html'));
  assert.ok(handoff.requestPath.endsWith('generation-request.json'));

  const afterHandoff = await store.loadSession(session.id);
  assert.equal(afterHandoff.status, 'needs_agent');
  assert.equal(afterHandoff.handoff.status, 'pending');
  assert.ok(afterHandoff.handoff.id);

  const pub = await store.publicSession(afterHandoff);
  assert.equal(pub.unresolved_annotation_count, 1);
  assert.equal(pub.handoff.host, 'dsh');
  assert.ok(pub.draft_html_path);

  // mark handoff sent, then claim.
  const sent = await store.markHandoffSent(session.id, afterHandoff.handoff.id);
  assert.equal(sent.handoff.status, 'sent');
  const claimed = await store.claimHandoff(session.id, afterHandoff.handoff.id);
  assert.equal(claimed.handoff.status, 'claimed');

  // Register final output.
  const resolved = path.join(dir, 'resolved.html');
  await writeFile(resolved, '<!doctype html><html><body><h1>final</h1></body></html>');
  const final = await store.registerFinal({ sessionId: session.id, resolvedHtmlPath: resolved });
  assert.equal(final.status, 'resolved');
  assert.ok(final.final_output_path.endsWith('.html'));
  assert.notEqual(final.final_output_path, source);

  const finalSession = await store.loadSession(session.id);
  assert.equal(finalSession.status, 'resolved');
  assert.equal(finalSession.handoff.status, 'resolved');

  // Non-overwriting: registering again versions the path.
  const again = await store.registerFinal({ sessionId: session.id, resolvedHtmlPath: resolved });
  assert.notEqual(again.final_output_path, final.final_output_path);

  // listSessions sees it.
  const list = await store.listSessions(10);
  assert.equal(list.total_count, 1);

  await rm(dir, { recursive: true, force: true });
});

test('http server: health, editor page, api save and generate', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'anno-http-'));
  const assets = fileURLToPath(new URL('../assets/', import.meta.url));
  const store = createStore({ dataDir: dir, host: 'dsh' });
  const server = createHttpServer({ store, assetsDir: assets });
  await server.start();
  const base = server.reviewUrlBase;

  try {
    const health = await fetch(`${base}/health`).then(r => r.json());
    assert.equal(health.ok, true);

    const source = path.join(dir, 'source.html');
    await writeFile(source, SAMPLE_HTML);
    const session = await store.createSession(source);

    // Editor page renders with placeholders replaced.
    const page = await fetch(server.reviewUrl(session.id));
    assert.equal(page.status, 200);
    const pageText = await page.text();
    assert.ok(pageText.includes(session.id));
    assert.ok(!pageText.includes('__SESSION_ID__'));

    // GET session state without token works.
    const getRes = await fetch(`${base}/api/session/${session.id}`);
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.session.session_id, session.id);

    // POST save without token is rejected.
    const saveNoToken = await fetch(`${base}/api/session/${session.id}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review: { edits: {}, formatChanges: {}, annotations: [], pageNotes: {}, activePage: 1 } })
    });
    assert.equal(saveNoToken.status, 400);

    // POST save with token succeeds.
    const saveRes = await fetch(`${base}/api/session/${session.id}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Review-Token': session.token },
      body: JSON.stringify({ review: { edits: { k: 'v' }, formatChanges: {}, annotations: [], pageNotes: {}, activePage: 1 } })
    });
    assert.equal(saveRes.status, 200);

    // Generate handoff.
    const genRes = await fetch(`${base}/api/session/${session.id}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Review-Token': session.token },
      body: JSON.stringify({ html: '<!doctype html><html><body>x</body></html>', review: { edits: {}, formatChanges: {}, annotations: [], pageNotes: {}, activePage: 1 } })
    });
    assert.equal(genRes.status, 202);
    const genBody = await genRes.json();
    assert.equal(genBody.handoff_ready, true);
    assert.ok(genBody.generation_request_path);
    assert.equal(genBody.session.status, 'needs_agent');
  } finally {
    await server.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test('host handoff: hasHostTarget predicate + onHandoff delivery payload', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'anno-handoff-'));
  const assets = fileURLToPath(new URL('../assets/', import.meta.url));
  const hostTargets = new Set();
  const deliveries = [];
  const store = createStore({
    dataDir: dir,
    host: 'dsh',
    hasHostTarget: id => hostTargets.has(id)
  });
  const server = createHttpServer({
    store,
    assetsDir: assets,
    onHandoff: async payload => { deliveries.push(payload); }
  });
  await server.start();

  try {
    const source = path.join(dir, 'source.html');
    await writeFile(source, SAMPLE_HTML);
    const session = await store.createSession(source);
    hostTargets.add(session.id);

    // Generate with edits (in-place) and an annotation; onHandoff must fire once.
    const review = {
      edits: { 'p1-e1': '星 辰 笔 记' },
      formatChanges: { 'p1-e8': { 'element.fontSize': '17px' } },
      annotations: [{ id: 'a1', key: 'k', page: 1, originalText: 'x', currentText: 'y', note: 'fix me', resolved: false, createdAt: new Date().toISOString() }],
      pageNotes: { '1': 'note' },
      activePage: 1
    };
    const genRes = await fetch(`${server.reviewUrlBase}/api/session/${session.id}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Review-Token': session.token },
      body: JSON.stringify({ html: '<!doctype html><html><body>x</body></html>', review })
    });
    assert.equal(genRes.status, 202);

    assert.equal(deliveries.length, 1);
    const payload = deliveries[0];
    assert.equal(payload.sessionId, session.id);
    assert.ok(payload.handoffId);
    assert.ok(payload.draftHtmlPath.endsWith('model-draft.html'));
    assert.ok(payload.generationRequestPath.endsWith('generation-request.json'));
    // The payload carries the full review — in-place edits included.
    assert.equal(payload.review.edits['p1-e1'], '星 辰 笔 记');
    assert.equal(payload.review.formatChanges['p1-e8']['element.fontSize'], '17px');
    assert.equal(payload.review.annotations[0].note, 'fix me');
    // The targeted session's handoff now reports has_host_target.
    const targetedPub = await store.publicSession(await store.loadSession(session.id));
    assert.equal(targetedPub.handoff.has_host_target, true);

    // A session without a host target reports false and still prepares the handoff.
    const orphan = await store.createSession(source);
    const orphanGen = await fetch(`${server.reviewUrlBase}/api/session/${orphan.id}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Review-Token': orphan.token },
      body: JSON.stringify({ html: '<!doctype html><html><body>y</body></html>', review: { edits: {}, formatChanges: {}, annotations: [], pageNotes: {}, activePage: 1 } })
    });
    assert.equal(orphanGen.status, 202);
    // The hook fires for every generate; gating delivery to a live host target is
    // the DSH binding's responsibility (lib/index.js), not anno-core's.
    assert.equal(deliveries.length, 2);
    const orphanPub = await store.publicSession(await store.loadSession(orphan.id));
    assert.equal(orphanPub.handoff.has_host_target, false);
  } finally {
    await server.close();
    await rm(dir, { recursive: true, force: true });
  }
});
