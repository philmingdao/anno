# Changelog

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
