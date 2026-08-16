# Anno

Anno is a local-first HTML review workspace for AI coding agents. It opens an isolated copy of a local HTML file in a browser, supports direct text and formatting edits, element comments, area annotations, and slide-aware review, then returns a durable handoff that an agent can claim and resolve into a verified standalone HTML file.

The repository contains one shared MCP server and host-neutral skill, plus lightweight manifests for Codex, Claude Code, WorkBuddy, and CodeBuddy. DeepSeek Harness support is experimental while its plugin API remains in developer preview.

## Highlights

- Local-only HTTP editor bound to `127.0.0.1`
- Source files are never overwritten
- Direct text, typography, color, position, page-note, element, and area editing
- Durable, idempotent agent handoffs
- Legacy compatibility with existing `needs_codex` sessions
- Shared MCP and `SKILL.md` implementation across supported hosts
- Simplified Chinese and English UI, light and dark themes

## Requirements

- Node.js 22 or newer
- A host that supports local stdio MCP servers and can access local files
- A browser for the review editor

## Install in Codex

```bash
codex plugin marketplace add philmingdao/anno --ref main
codex plugin add anno@anno
```

For reproducible installations, replace `main` with a release tag such as `v0.2.1`.

## Install in Claude Code

```text
/plugin marketplace add philmingdao/anno
/plugin install anno@anno
```

## Install in WorkBuddy or CodeBuddy

Add `philmingdao/anno` as a plugin marketplace, then install `anno`. During local development, load `plugins/anno` with the host's plugin-directory option.

## Use the MCP server directly

After the npm package is published, any stdio MCP client can launch:

```bash
npx -y @philmingdao/anno
```

Until then, clone the repository, install dependencies, build, and point the MCP client to `plugins/anno/dist/index.js`.

## Development

```bash
npm install
npm test
npm run pack:check
```

The publishable package lives in `plugins/anno`. Generated dependencies and local review sessions are not committed.

## Data and privacy

Anno processes HTML and annotations locally. The editor binds only to loopback and validates host and origin headers. Generic hosts store sessions under `~/.anno`; Codex keeps its compatible default under `~/Library/Application Support/Codex/anno` on macOS. Set `ANNO_DATA_DIR` to choose another directory.

Anno does not upload reviewed files. The connected agent host may process the draft and annotations according to that host's own data policy.

## Compatibility

See [docs/compatibility.md](docs/compatibility.md) for host-specific behavior and limitations.

## License

MIT. The bundled WDXL Lubrifont font remains covered by its separate SIL Open Font License in `plugins/anno/assets/OFL-WDXL-Lubrifont.txt`.
