# Anno for DeepSeek Harness (native)

`@philmingdao/anno-dsh-native` is a **native** DeepSeek Harness plugin for [Anno](https://github.com/philmingdao/anno) — a local-first HTML review, editing, and annotation workspace for coding agents.

Unlike [`@philmingdao/anno-dsh`](../dsh/README.md), which bridges the MCP server through the official DSH MCP client, this package runs Anno **in-process**: the local review HTTP server, the on-disk session store, and the six `html_review_*` model tools all live inside the Harness process. There is no MCP layer, no child `npx` process, and no separate server to launch.

## What it provides

- A loopback-only HTTP review server (`127.0.0.1`, ephemeral port).
- Persistent review sessions under `$ANNO_DATA_DIR` (default `~/.anno/sessions`); the source file is never overwritten and outputs are versioned (`-reviewed.html`, `-reviewed-v2.html`, …).
- Six model tools, registered with DSH's native tool registry:

  - `html_review_start_session`
  - `html_review_get_session`
  - `html_review_claim_handoff`
  - `html_review_mark_handoff_sent`
  - `html_review_list_sessions`
  - `html_review_register_final`

- A `tool:anno` system-prompt section that teaches the agent the start → review → claim → resolve workflow.

## Requirements

- DeepSeek Harness `>=0.1.0-rc.6 <0.2.0`
- Node.js 22 or newer

## Install

The package is a DSH profile bundle: `dsh plugin add` installs it and applies its `cordis.patch.yml`, which inserts the `anno-native` row into the profile (host) composition.

```sh
dsh plugin --profile web add @philmingdao/anno-dsh-native
# or from a source checkout:
dsh plugin --profile web add ./adapters/dsh-native
```

Then start Harness normally:

```sh
dsh web
```

The tools appear as `html_review_*` (no MCP namespace prefix). Because the row sits on the host plane, every agent on that profile shares one review server and one session store.

### Source checkout

```sh
npm install
cd adapters/dsh-native
npm test
dsh plugin --profile web add "$(pwd)"
```

Use a temporary `--dsh-home` when testing without changing your normal profiles.

## Use

Ask Harness to open or review an HTML file. It calls `html_review_start_session` with the absolute source path and opens the returned `review_url` for the user.

When the user clicks **提交给 Agent** in the browser editor, the review server prepares the handoff and pushes it straight back into the originating agent conversation: the plugin captures the calling agent when the session is created and, on submission, queues an ordinary follow-up turn (`agent.followup`) carrying the full review — in-place text edits, format changes, element/area annotations, and page notes — so the agent claims the handoff immediately and resolves it into a verified standalone HTML file via `html_review_register_final`, without any manual polling.

The receiving turn's prompt instructs the agent to call `html_review_claim_handoff` first (durable receipt), then `html_review_get_session` to reload the full session and apply the edits and annotations against the draft HTML, then `html_review_register_final`. The in-process push is best-effort: if the originating agent is no longer live, the handoff is still persisted on disk and the agent can claim it through the ordinary `html_review_*` tools.

## Architecture

```text
DSH profile composition
  -> @philmingdao/anno-dsh-native  (cordis plugin + bundle patch)
    -> anno-core.js                (HTTP server + on-disk session/review/handoff store, node-only)
    -> index.js                    (registers html_review_* tools + tool:anno prompt section)
```

`lib/anno-core.js` is deliberately free of DSH imports and is unit-tested directly (`npm test`). It exposes an `onHandoff` hook (invoked by the HTTP `generate` endpoint with the full review payload) and a `hasHostTarget` predicate (reported as `has_host_target` on the session projection) so the host binding can deliver handoffs without the core depending on any host runtime.

`lib/index.js` is the thin Cordis binding that injects `tools`, `systemPrompt`, and `agents`, starts the server as a fiber-owned effect, and registers the tools using raw JSON-Schema definitions directly against the `tools` registry. It captures the calling agent on `html_review_start_session` and, through `onHandoff`, delivers the submission back as an `agent.followup` notice. It imports no `@deepseek-ai/dsh-tools` (or any other DSH package) — the follow-up user message is built from the same shape `createUserMessage` produces, using only `node:crypto` — so the package keeps zero external dependencies and loads from any location (including a `link:`-installed source checkout).

## Configuration

The `anno-native` row accepts:

| Field | Default | Meaning |
| --- | --- | --- |
| `host` | `dsh` | Host kind stamped on session records. |
| `dataDir` | `$ANNO_DATA_DIR` or `~/.anno` | Root for persisted review sessions. |
| `assetsDir` | package `assets/` | Directory holding `editor.html` / `handoff.html`. |

## Uninstall

```sh
dsh plugin --profile web remove @philmingdao/anno-dsh-native
```

Existing review sessions under the data directory are left in place.

## License

MIT. The editor UI is the same Anno asset set; see the repository root for the bundled font's SIL Open Font License.
