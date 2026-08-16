# Changelog

## 0.4.0 - 2026-08-16

- Added `anno setup`, `anno doctor`, and `anno uninstall` with automatic host detection, JSONC-preserving merges, scoped backups, Skill installation, and MCP handshake verification.
- Replaced clone/build instructions with one `npx` command across all ten README languages.
- Added native Cursor marketplace/plugin metadata, a native Antigravity bundle, direct GitHub Copilot plugin support, and official MCP Registry metadata.
- Version-pinned all manual integration templates to the published npm package.
- Added installer idempotency, preservation, uninstall, Antigravity, Muse, CLI, package, and manifest validation coverage.

## 0.3.1 - 2026-08-16

- Added an explicit support matrix to every translated README.
- Added in-README installation steps and configuration destinations for Cursor, Google Antigravity, Windsurf, GitHub Copilot CLI/Chat, and Meta Muse Code.
- Added validation that prevents translated READMEs from omitting any supported host template.

## 0.3.0 - 2026-08-16

- Added full README translations for Japanese, Korean, French, Spanish, German, Italian, Portuguese, and Thai, with a ten-language switcher.
- Added host-neutral support and copy-ready MCP templates for Cursor, Google Antigravity, Windsurf, GitHub Copilot CLI/Chat, and Meta Muse Code.
- Documented local-browser handoff behavior and cloud-agent limitations.
- Marked Muse Code integration experimental while its public configuration contract remains in beta.

## 0.2.1 - 2026-08-16

- Make the Codex fallback runner portable across Windows, macOS, and Linux.
- Prevent fallback transport errors from terminating the MCP server.

## 0.2.0 - 2026-08-16

- Productized Anno as a public MIT-licensed repository and publishable npm package.
- Added Codex, Claude Code, WorkBuddy, and CodeBuddy plugin manifests and marketplace catalogs.
- Replaced new `needs_codex` state with host-neutral `needs_agent` while retaining legacy compatibility.
- Added configurable host and data-directory selection.
- Limited automatic CLI resume behavior to Codex hosts.
- Updated browser and skill copy from Codex-specific handoff language to Agent-neutral language.
- Added CI, packaging validation, compatibility documentation, and an experimental DeepSeek Harness Cordis-to-MCP bridge.
