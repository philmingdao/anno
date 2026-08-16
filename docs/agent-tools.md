# Agent tool integrations

Anno is a local stdio MCP server. The editor always runs on loopback, so these integrations are intended for agents running on the same computer as the reviewed HTML file. Replace `/absolute/path/to/anno` in every template with the absolute path to this repository.

All non-Codex integrations use the durable manual handoff: open the returned local URL, submit the review, then ask the current agent to call `html_review_get_session` and claim the pending handoff. They never launch another agent CLI.

## Cursor

Copy [`plugins/anno/integrations/cursor/mcp.json`](../plugins/anno/integrations/cursor/mcp.json) to `.cursor/mcp.json` in a project or merge it into `~/.cursor/mcp.json`. Cursor supports local stdio MCP servers in both the IDE and Cursor Agent CLI. See the [official Cursor MCP documentation](https://docs.cursor.com/context/model-context-protocol).

## Google Antigravity

Copy [`plugins/anno/integrations/antigravity/mcp_config.json`](../plugins/anno/integrations/antigravity/mcp_config.json) to `.agents/mcp_config.json` in a workspace, or merge it into `~/.gemini/config/mcp_config.json`. Refresh the MCP server list after saving. See the [official Antigravity MCP documentation](https://antigravity.google/docs/mcp).

## Windsurf

Merge [`plugins/anno/integrations/windsurf/mcp_config.json`](../plugins/anno/integrations/windsurf/mcp_config.json) into `~/.codeium/windsurf/mcp_config.json`, then refresh Cascade's MCP list. Windsurf supports stdio, Streamable HTTP, and SSE; Anno uses stdio. See the [official Windsurf MCP documentation](https://docs.windsurf.com/windsurf/cascade/mcp).

## GitHub Copilot

For Copilot CLI, either merge [`plugins/anno/integrations/github-copilot/mcp-config.json`](../plugins/anno/integrations/github-copilot/mcp-config.json) into `~/.copilot/mcp-config.json` or run:

```bash
copilot mcp add anno --env ANNO_HOST=copilot -- node /absolute/path/to/anno/plugins/anno/dist/index.js
```

For Copilot Chat in VS Code, copy [`plugins/anno/integrations/github-copilot/vscode-mcp.json`](../plugins/anno/integrations/github-copilot/vscode-mcp.json) to `.vscode/mcp.json`. Anno is designed for local Copilot CLI and IDE sessions; GitHub's cloud coding agent cannot expose a loopback review URL to the user's browser. See GitHub's official documentation for [Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers) and [Copilot Chat](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp-in-your-ide/extend-copilot-chat-with-mcp).

## Meta Muse Code

Muse Code support is experimental because the product is in beta and a stable public MCP configuration reference was not available when this integration was prepared. [`plugins/anno/integrations/muse-code/mcp.json`](../plugins/anno/integrations/muse-code/mcp.json) uses the conventional `mcpServers` stdio format. If the installed Muse Code build does not discover it, configure the same command through its MCP manager when available. Anno itself does not depend on a Muse-specific API.

## Security and trust

Review MCP configuration before enabling it. Anno needs local file access only for HTML files explicitly opened through its tools. It binds the editor to `127.0.0.1`, validates request origins, never overwrites the source file, and does not upload reviewed files.
