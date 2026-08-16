<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="plugins/anno/assets/logo-dark.svg">
    <img src="plugins/anno/assets/logo.svg" alt="Anno" width="240">
  </picture>
</p>

<p align="center">
  <strong>English</strong> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.it.md">Italiano</a> · <a href="README.pt.md">Português</a> · <a href="README.th.md">ไทย</a>
</p>

# Anno

Anno is a local-first HTML review workspace for AI coding agents. It opens an isolated copy of a local HTML file in a browser, supports direct text and formatting edits, element comments, area annotations, and slide-aware review, then returns a durable handoff that an agent can claim and resolve into a verified standalone HTML file.

The repository contains one shared MCP server and host-neutral skill, native plugin manifests where a host supports them, and copy-ready MCP templates for Cursor, Google Antigravity, Windsurf, GitHub Copilot, and Meta Muse Code. DeepSeek Harness and Muse Code support are experimental.

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

## Supported agent tools

Codex, Claude Code, WorkBuddy, and CodeBuddy use packaged plugin manifests. Cursor, Google Antigravity, Windsurf, GitHub Copilot CLI/Chat, and Muse Code connect to the same local stdio MCP server through host-specific configuration templates. DeepSeek Harness uses an experimental native bridge.

See [Agent tool integrations](docs/agent-tools.md) for copy-ready configuration and host limitations.

## Install in Codex

```bash
codex plugin marketplace add philmingdao/anno --ref main
codex plugin add anno@anno
```

For reproducible installations, replace `main` with a release tag such as `v0.3.0`.

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
