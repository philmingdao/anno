// Anno core: an in-process, local-first HTML review server and its persisted
// session/review/handoff state. This module is deliberately free of any DSH
// dependency — it uses only Node built-ins — so it can be unit-tested in
// isolation and reused by any host runtime.
//
// It is a faithful port of the `@philmingdao/anno` MCP server
// (plugins/anno/src/index.ts), with the Codex-specific CLI dispatch fallback
// removed: for DeepSeek Harness the receiving agent claims the handoff
// directly through the `html_review_*` tools.

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rename,
  stat,
  unlink,
  writeFile
} from 'node:fs/promises';
import { randomBytes, randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SERVER_NAME = 'anno-dsh-native';
export const SERVER_VERSION = '0.1.0';
export const MAX_HTML_BYTES = 100 * 1024 * 1024;
export const MAX_JSON_BYTES = 2 * 1024 * 1024;

export const HOST_KINDS = [
  'codex', 'claude', 'codebuddy', 'workbuddy', 'cursor', 'antigravity',
  'windsurf', 'copilot', 'muse', 'dsh', 'generic'
];

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_ASSETS_DIR = path.join(PACKAGE_ROOT, 'assets');
export const DEFAULT_DATA_DIR = process.env.ANNO_DATA_DIR
  ? path.resolve(process.env.ANNO_DATA_DIR)
  : process.env.ANNO_HOME
    ? path.resolve(process.env.ANNO_HOME)
    : path.join(homedir(), '.anno');

export const emptyReview = () => ({
  edits: {},
  formatChanges: {},
  annotations: [],
  pageNotes: {},
  activePage: 1,
  updatedAt: new Date().toISOString()
});

const ID_RE = /^[0-9a-f-]{36}$/;

function requireValidSessionId(id, field = 'session_id') {
  if (typeof id !== 'string' || !ID_RE.test(id)) throw new Error(`Invalid ${field}.`);
  return id;
}

export function countSlides(html) {
  const matches = html.match(/<section\b[^>]*\bdata-slide\s*=/gi);
  if (matches?.length) return matches.length;
  const sectionMatches = html.match(/<section\b/gi);
  return Math.max(1, sectionMatches?.length ?? 1);
}

export function defaultOutputPath(sourcePath) {
  const parsed = path.parse(sourcePath);
  return path.join(parsed.dir, `${parsed.name}-reviewed${parsed.ext || '.html'}`);
}

function requireAbsoluteHtmlPath(value, field) {
  if (typeof value !== 'string' || !path.isAbsolute(value)) {
    throw new Error(`${field} must be an absolute path.`);
  }
  const resolved = path.resolve(value);
  if (!/\.html?$/i.test(resolved)) throw new Error(`${field} must end in .html or .htm.`);
  return resolved;
}

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function nextAvailablePath(target, forbidden) {
  const parsed = path.parse(target);
  let candidate = target;
  let version = 2;
  while (candidate === forbidden || (await exists(candidate))) {
    candidate = path.join(parsed.dir, `${parsed.name}-v${version}${parsed.ext || '.html'}`);
    version += 1;
  }
  return candidate;
}

async function atomicWrite(target, content) {
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.${randomUUID()}.tmp`;
  await writeFile(temporary, content);
  await rename(temporary, target);
}

async function readJson(target) {
  return JSON.parse(await readFile(target, 'utf8'));
}

// ── sanitize the browser-posted review state ────────────────────────────────
function asString(value, max) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function parseReviewState(value) {
  const input = value && typeof value === 'object' ? value : {};
  const edits = {};
  const formatChanges = {};
  const annotations = [];
  const pageNotes = {};

  if (input.edits && typeof input.edits === 'object') {
    for (const [key, text] of Object.entries(input.edits)) {
      edits[String(key).slice(0, 200)] = asString(text, 20000);
    }
  }
  if (input.formatChanges && typeof input.formatChanges === 'object') {
    for (const [key, changes] of Object.entries(input.formatChanges)) {
      const map = {};
      if (changes && typeof changes === 'object') {
        for (const [prop, val] of Object.entries(changes)) {
          map[String(prop).slice(0, 200)] = asString(val, 500);
        }
      }
      formatChanges[String(key).slice(0, 200)] = map;
    }
  }
  if (Array.isArray(input.annotations)) {
    for (const item of input.annotations.slice(0, 5000)) {
      if (!item || typeof item !== 'object') continue;
      const annotation = {
        id: asString(item.id, 100) || randomUUID(),
        key: asString(item.key, 200),
        page: Number.isInteger(item.page) && item.page >= 1 ? item.page : 1,
        originalText: asString(item.originalText, 20000),
        currentText: asString(item.currentText, 20000),
        note: asString(item.note, 5000),
        resolved: Boolean(item.resolved),
        createdAt: asString(item.createdAt, 100) || new Date().toISOString()
      };
      if (!annotation.key) continue;
      if (item.kind === 'element' || item.kind === 'area') annotation.kind = item.kind;
      if (Array.isArray(item.targetKeys)) {
        annotation.targetKeys = item.targetKeys.slice(0, 2000).map(k => asString(k, 200));
      }
      if (item.rect && typeof item.rect === 'object'
        && Number.isFinite(item.rect.x) && Number.isFinite(item.rect.y)
        && Number.isFinite(item.rect.width) && Number.isFinite(item.rect.height)) {
        annotation.rect = {
          x: item.rect.x,
          y: item.rect.y,
          width: Math.max(0, item.rect.width),
          height: Math.max(0, item.rect.height)
        };
      }
      annotations.push(annotation);
    }
  }
  if (input.pageNotes && typeof input.pageNotes === 'object') {
    for (const [key, note] of Object.entries(input.pageNotes)) {
      pageNotes[String(key).slice(0, 20)] = asString(note, 10000);
    }
  }
  return {
    edits,
    formatChanges,
    annotations,
    pageNotes,
    activePage: Number.isInteger(input.activePage) && input.activePage >= 1
      ? Math.min(input.activePage, 10000) : 1,
    updatedAt: new Date().toISOString()
  };
}

// ── session store ───────────────────────────────────────────────────────────
export function createStore({ dataDir = DEFAULT_DATA_DIR, host = 'dsh', hasHostTarget = () => false } = {}) {
  const sessionsRoot = path.join(path.resolve(dataDir), 'sessions');

  const sessionDirectory = id => path.join(sessionsRoot, id);
  const sessionFile = id => path.join(sessionDirectory(id), 'session.json');
  const reviewFile = id => path.join(sessionDirectory(id), 'review.json');

  async function ensureReady() {
    await mkdir(sessionsRoot, { recursive: true });
  }

  async function loadSession(id) {
    requireValidSessionId(id);
    try {
      return await readJson(sessionFile(id));
    } catch (error) {
      if (error.code === 'ENOENT') throw new Error(`Review session ${id} was not found.`);
      throw error;
    }
  }

  async function saveSession(session) {
    session.updatedAt = new Date().toISOString();
    await atomicWrite(sessionFile(session.id), JSON.stringify(session, null, 2));
  }

  async function loadReview(id) {
    try {
      return await readJson(reviewFile(id));
    } catch (error) {
      if (error.code === 'ENOENT') return emptyReview();
      throw error;
    }
  }

  async function saveReview(id, review) {
    review.updatedAt = new Date().toISOString();
    await atomicWrite(reviewFile(id), JSON.stringify(review, null, 2));
  }

  async function createSession(sourcePathInput, outputPathInput) {
    const sourcePath = requireAbsoluteHtmlPath(sourcePathInput, 'source_path');
    const sourceStat = await stat(sourcePath);
    if (!sourceStat.isFile()) throw new Error('source_path must point to a file.');
    if (sourceStat.size > MAX_HTML_BYTES) throw new Error('Source HTML exceeds the 100 MB limit.');
    const outputTargetInput = outputPathInput
      ? requireAbsoluteHtmlPath(outputPathInput, 'output_path')
      : defaultOutputPath(sourcePath);
    const outputTarget = await nextAvailablePath(outputTargetInput, sourcePath);
    const id = randomUUID();
    const directory = sessionDirectory(id);
    const sourceCopyPath = path.join(directory, 'source.html');
    await mkdir(directory, { recursive: true });
    await copyFile(sourcePath, sourceCopyPath);
    const html = await readFile(sourceCopyPath, 'utf8');
    const now = new Date().toISOString();
    const session = {
      id,
      token: randomBytes(32).toString('hex'),
      sourcePath,
      sourceName: path.basename(sourcePath),
      sourceCopyPath,
      outputTarget,
      outputs: [],
      status: 'editing',
      createdAt: now,
      updatedAt: now,
      sourceBytes: sourceStat.size,
      slideCount: countSlides(html),
      host
    };
    await saveSession(session);
    await saveReview(id, emptyReview());
    return session;
  }

  async function publicSession(session) {
    const review = await loadReview(session.id);
    const directory = sessionDirectory(session.id);
    const draftPath = path.join(directory, 'model-draft.html');
    const requestPath = path.join(directory, 'generation-request.json');
    return {
      session_id: session.id,
      source_path: session.sourcePath,
      source_name: session.sourceName,
      output_target: session.outputTarget,
      outputs: session.outputs,
      status: session.status,
      slide_count: session.slideCount,
      source_bytes: session.sourceBytes,
      edit_count: Object.keys(review.edits).length,
      format_change_count: Object.keys(review.formatChanges).length,
      annotation_count: review.annotations.length,
      unresolved_annotation_count: review.annotations.filter(item => !item.resolved).length,
      page_note_count: Object.values(review.pageNotes).filter(Boolean).length,
      created_at: session.createdAt,
      updated_at: session.updatedAt,
      ...(session.generationError ? { generation_error: session.generationError } : {}),
      ...(session.generationStartedAt ? { generation_started_at: session.generationStartedAt } : {}),
      ...(session.generationFinishedAt ? { generation_finished_at: session.generationFinishedAt } : {}),
      ...(await exists(draftPath) ? { draft_html_path: draftPath } : {}),
      ...(await exists(requestPath) ? { generation_request_path: requestPath } : {}),
      ...(session.handoff ? { handoff: {
        id: session.handoff.id,
        status: session.handoff.status,
        attempts: session.handoff.attempts,
        created_at: session.handoff.createdAt,
        updated_at: session.handoff.updatedAt,
        ...(session.handoff.nextAttemptAt ? { next_attempt_at: session.handoff.nextAttemptAt } : {}),
        ...(session.handoff.lastError ? { last_error: session.handoff.lastError } : {}),
        ...(session.handoff.sentAt ? { sent_at: session.handoff.sentAt } : {}),
        ...(session.handoff.claimedAt ? { claimed_at: session.handoff.claimedAt } : {}),
        ...(session.handoff.resolvedAt ? { resolved_at: session.handoff.resolvedAt } : {}),
        has_host_target: hasHostTarget(session.id),
        host: session.host || 'generic'
      } } : {})
    };
  }

  function assertHtmlDocument(html) {
    if (Buffer.byteLength(html) > MAX_HTML_BYTES) throw new Error('Generated HTML exceeds the 100 MB limit.');
    if (!/<html[\s>]/i.test(html) && !/<!doctype\s+html/i.test(html)) {
      throw new Error('Generated content is not an HTML document.');
    }
  }

  async function finalizeFromBrowser(session, html, review) {
    assertHtmlDocument(html);
    const outputPath = await nextAvailablePath(session.outputTarget, session.sourcePath);
    await atomicWrite(outputPath, html);
    await saveReview(session.id, review);
    session.outputs.push(outputPath);
    session.status = review.annotations.some(item => !item.resolved) ? 'needs_agent' : 'generated';
    await saveSession(session);
    return outputPath;
  }

  async function prepareAgentHandoff(session, html, review) {
    assertHtmlDocument(html);
    const directory = sessionDirectory(session.id);
    const draftPath = path.join(directory, 'model-draft.html');
    const requestPath = path.join(directory, 'generation-request.json');
    await atomicWrite(draftPath, html);
    await saveReview(session.id, review);
    const now = new Date().toISOString();
    const handoff = { id: randomUUID(), status: 'pending', createdAt: now, updatedAt: now, attempts: 0 };
    await atomicWrite(requestPath, JSON.stringify({
      session_id: session.id,
      handoff_id: handoff.id,
      source_path: session.sourcePath,
      draft_html_path: draftPath,
      output_target: session.outputTarget,
      edits: review.edits,
      format_changes: review.formatChanges,
      annotations: review.annotations,
      page_notes: review.pageNotes
    }, null, 2));
    session.status = 'needs_agent';
    session.handoff = handoff;
    session.generationError = undefined;
    session.generationStartedAt = new Date().toISOString();
    session.generationFinishedAt = undefined;
    await saveSession(session);
    return { draftPath, requestPath };
  }

  async function markHandoffSent(sessionId, handoffId) {
    const session = await loadSession(sessionId);
    if (!session.handoff || session.handoff.id !== handoffId) {
      throw new Error('Handoff id does not match the active generation request.');
    }
    if (!['claimed', 'resolved'].includes(session.handoff.status)) {
      session.handoff.status = 'sent';
      session.handoff.sentAt ||= new Date().toISOString();
      session.handoff.updatedAt = new Date().toISOString();
      session.handoff.lastError = undefined;
      session.handoff.nextAttemptAt = undefined;
      await saveSession(session);
    }
    return session;
  }

  async function claimHandoff(sessionId, handoffId) {
    const session = await loadSession(sessionId);
    if (!session.handoff || session.handoff.id !== handoffId) {
      throw new Error('Handoff id does not match the active generation request.');
    }
    if (session.handoff.status !== 'resolved') {
      session.handoff.status = 'claimed';
      session.handoff.claimedAt ||= new Date().toISOString();
      session.handoff.updatedAt = new Date().toISOString();
      session.handoff.lastError = undefined;
      session.handoff.nextAttemptAt = undefined;
      await saveSession(session);
    }
    return session;
  }

  async function listSessions(limit) {
    const records = [];
    const entries = await readdir(sessionsRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      try {
        records.push(await publicSession(await loadSession(entry.name)));
      } catch { /* skip malformed session */ }
    }
    records.sort((left, right) => right.updated_at.localeCompare(left.updated_at));
    return {
      total_count: records.length,
      sessions: records.slice(0, limit),
      has_more: records.length > limit
    };
  }

  async function registerFinal({ sessionId, resolvedHtmlPath, outputPath }) {
    const session = await loadSession(sessionId);
    const resolvedPath = requireAbsoluteHtmlPath(resolvedHtmlPath, 'resolved_html_path');
    const resolvedStat = await stat(resolvedPath);
    if (!resolvedStat.isFile() || resolvedStat.size > MAX_HTML_BYTES) {
      throw new Error('Resolved HTML must be a file smaller than 100 MB.');
    }
    const requestedTarget = outputPath
      ? requireAbsoluteHtmlPath(outputPath, 'output_path')
      : session.outputTarget;
    const finalPath = await nextAvailablePath(requestedTarget, session.sourcePath);
    if (path.resolve(resolvedPath) !== path.resolve(finalPath)) {
      await mkdir(path.dirname(finalPath), { recursive: true });
      await copyFile(resolvedPath, finalPath);
    }
    session.outputs.push(finalPath);
    session.status = 'resolved';
    if (session.handoff) {
      session.handoff.status = 'resolved';
      session.handoff.resolvedAt = new Date().toISOString();
      session.handoff.updatedAt = session.handoff.resolvedAt;
    }
    await saveSession(session);
    return { session_id: sessionId, final_output_path: finalPath, status: 'resolved' };
  }

  return {
    sessionsRoot,
    ensureReady,
    createSession,
    loadSession,
    saveSession,
    loadReview,
    saveReview,
    publicSession,
    finalizeFromBrowser,
    prepareAgentHandoff,
    markHandoffSent,
    claimHandoff,
    listSessions,
    registerFinal
  };
}

// ── HTTP review server ──────────────────────────────────────────────────────
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character] ?? character);
}

function json(res, statusCode, body) {
  const encoded = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(encoded),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'"
  });
  res.end(encoded);
}

function text(res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

async function readBody(req, maxBytes) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) throw new Error(`Request body exceeds ${Math.round(maxBytes / 1024 / 1024)} MB.`);
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

async function serveFile(res, target, contentType) {
  const fileStat = await stat(target);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': fileStat.size,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  createReadStream(target).pipe(res);
}

export function createHttpServer({
  store,
  assetsDir = DEFAULT_ASSETS_DIR,
  maxHtmlBytes = MAX_HTML_BYTES,
  maxJsonBytes = MAX_JSON_BYTES,
  onHandoff
}) {
  let httpPort = 0;

  function validateLocalRequest(req) {
    const host = req.headers.host ?? '';
    if (host !== `127.0.0.1:${httpPort}` && host !== `localhost:${httpPort}`) {
      throw new Error('Invalid Host header.');
    }
    const origin = req.headers.origin;
    if (origin && origin !== `http://127.0.0.1:${httpPort}` && origin !== `http://localhost:${httpPort}`) {
      throw new Error('Invalid Origin header.');
    }
  }

  function verifyToken(req, session) {
    if (req.headers['x-review-token'] !== session.token) throw new Error('Invalid review token.');
  }

  async function handleHttp(req, res) {
    try {
      validateLocalRequest(req);
      const requestUrl = new URL(req.url ?? '/', `http://127.0.0.1:${httpPort}`);

      if (requestUrl.pathname === '/health') {
        json(res, 200, { ok: true, service: SERVER_NAME, version: SERVER_VERSION });
        return;
      }

      const pageMatch = requestUrl.pathname.match(/^\/session\/([0-9a-f-]{36})\/$/);
      if (pageMatch?.[1]) {
        const session = await store.loadSession(pageMatch[1]);
        const template = await readFile(path.join(assetsDir, 'editor.html'), 'utf8');
        const rendered = template
          .replaceAll('__SESSION_ID__', session.id)
          .replaceAll('__SESSION_TOKEN__', session.token)
          .replaceAll('__SOURCE_NAME__', escapeHtml(session.sourceName));
        text(res, 200, rendered, 'text/html; charset=utf-8');
        return;
      }

      const sourceMatch = requestUrl.pathname.match(/^\/session\/([0-9a-f-]{36})\/source\.html$/);
      if (sourceMatch?.[1]) {
        const session = await store.loadSession(sourceMatch[1]);
        await serveFile(res, session.sourceCopyPath, 'text/html; charset=utf-8');
        return;
      }

      const apiMatch = requestUrl.pathname.match(/^\/api\/session\/([0-9a-f-]{36})(?:\/(save|finalize|generate|handoff-sent))?$/);
      if (apiMatch?.[1]) {
        const session = await store.loadSession(apiMatch[1]);
        if (req.method === 'GET' && !apiMatch[2]) {
          json(res, 200, { session: await store.publicSession(session), review: await store.loadReview(session.id) });
          return;
        }
        verifyToken(req, session);

        if (req.method === 'POST' && apiMatch[2] === 'save') {
          const body = JSON.parse((await readBody(req, maxJsonBytes)).toString('utf8'));
          const review = parseReviewState(body.review);
          await store.saveReview(session.id, review);
          if (session.status !== 'generating') session.status = 'editing';
          await store.saveSession(session);
          json(res, 200, { ok: true, session: await store.publicSession(session) });
          return;
        }

        if (req.method === 'POST' && apiMatch[2] === 'finalize') {
          const body = JSON.parse((await readBody(req, maxHtmlBytes + maxJsonBytes)).toString('utf8'));
          if (typeof body.html !== 'string') throw new Error('html must be a string.');
          const review = parseReviewState(body.review);
          const outputPath = await store.finalizeFromBrowser(session, body.html, review);
          json(res, 200, { ok: true, output_path: outputPath, session: await store.publicSession(session) });
          return;
        }

        if (req.method === 'POST' && apiMatch[2] === 'generate') {
          const body = JSON.parse((await readBody(req, maxHtmlBytes + maxJsonBytes)).toString('utf8'));
          if (typeof body.html !== 'string') throw new Error('html must be a string.');
          const review = parseReviewState(body.review);
          const handoff = await store.prepareAgentHandoff(session, body.html, review);
          if (onHandoff) {
            try {
              await onHandoff({
                sessionId: session.id,
                handoffId: session.handoff?.id,
                sourcePath: session.sourcePath,
                draftHtmlPath: handoff.draftPath,
                generationRequestPath: handoff.requestPath,
                outputTarget: session.outputTarget,
                review
              });
            } catch (error) {
              // Delivery is best-effort: the handoff is already persisted, so a
              // failed push must not turn the accepted generation into an error.
              console.error(`anno: host handoff delivery failed: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
          json(res, 202, {
            ok: true,
            handoff_ready: true,
            draft_html_path: handoff.draftPath,
            generation_request_path: handoff.requestPath,
            session: await store.publicSession(await store.loadSession(session.id))
          });
          return;
        }

        if (req.method === 'POST' && apiMatch[2] === 'handoff-sent') {
          const body = JSON.parse((await readBody(req, maxJsonBytes)).toString('utf8'));
          if (typeof body.handoff_id !== 'string') throw new Error('handoff_id must be a string.');
          const updated = await store.markHandoffSent(session.id, body.handoff_id);
          json(res, 200, { ok: true, session: await store.publicSession(updated) });
          return;
        }
      }

      text(res, 404, 'Not found');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      json(res, /not found/i.test(message) ? 404 : 400, { ok: false, error: message });
    }
  }

  const server = createServer((req, res) => void handleHttp(req, res));
  let readyResolve;
  const ready = new Promise(resolve => { readyResolve = resolve; });

  return {
    get port() { return httpPort; },
    get reviewUrlBase() { return `http://127.0.0.1:${httpPort}`; },
    reviewUrl(sessionId) { return `http://127.0.0.1:${httpPort}/session/${sessionId}/`; },
    whenReady() { return ready; },
    async start() {
      await store.ensureReady();
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => resolve());
      });
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Could not start the local review server.');
      httpPort = address.port;
      readyResolve();
    },
    close() {
      return new Promise(resolve => server.close(() => resolve()));
    }
  };
}

export async function toolErrorContent(error) {
  return `Anno error: ${error instanceof Error ? error.message : String(error)}`;
}
