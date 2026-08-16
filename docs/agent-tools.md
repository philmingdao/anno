# Agent tool integrations

Anno is a local stdio MCP server. Its review editor binds to loopback, so the agent must run on the same computer as the reviewed HTML file.

## Recommended installer

The published package contains one cross-platform installer for all supported hosts:

```bash
npx -y @philmingdao/anno@0.4.0 setup
```

Without `--host`, an interactive terminal detects installed tools and offers a selection. Automation can pass a comma-separated list. The installer merges only `mcpServers.anno`, preserves JSONC comments, writes timestamped backups before changes, installs the shared Skill, and performs an MCP `initialize` plus `tools/list` check.

```bash
npx -y @philmingdao/anno@0.4.0 setup --host cursor,windsurf,copilot
npx -y @philmingdao/anno@0.4.0 setup --host antigravity --scope project
npx -y @philmingdao/anno@0.4.0 doctor --host cursor
npx -y @philmingdao/anno@0.4.0 uninstall --host cursor
```

### Install behavior by host

| Host | Installer behavior | Native alternative |
| --- | --- | --- |
| Codex | Registers/updates the `anno` marketplace and installs `anno@anno` | `codex plugin marketplace add philmingdao/anno --ref v0.4.0`, then `codex plugin add anno@anno` |
| Claude Code | Registers/updates the marketplace and installs `anno@anno` | `/plugin marketplace add philmingdao/anno`, then `/plugin install anno@anno` |
| WorkBuddy / CodeBuddy | Uses the host's plugin marketplace commands | Add `philmingdao/anno`, then install `anno@anno` |
| Cursor | Merges MCP and installs the Skill; the repo also ships a native Cursor plugin | Install from Cursor Marketplace after listing acceptance |
| Google Antigravity | Writes a complete native plugin bundle for CLI and IDE locations | `agy plugin install /path/to/host-plugins/antigravity` |
| Windsurf | Merges Cascade MCP and installs the Skill | Use the version-pinned template below |
| GitHub Copilot CLI | Merges MCP and installs the Skill | `copilot plugin install philmingdao/anno:plugins/anno` |
| DeepSeek Harness | Independent native plug-in | `dsh plugin --profile web add github:philmingdao/anno-dsh-native` |
| Muse Code | Requires a caller-confirmed `--config` path | Experimental; use the installed build's MCP manager |

If Codex already has a different Anno plugin id, setup stops instead of replacing it. Review the conflict and rerun with `--force` only when the native marketplace installation should become active.

## Cursor

The repository includes `.cursor-plugin/marketplace.json`, `plugins/anno/.cursor-plugin/plugin.json`, a native `mcp.json`, and the shared Skill. Until the marketplace listing is accepted, use `setup --host cursor`. The manual fallback is [`plugins/anno/integrations/cursor/mcp.json`](../plugins/anno/integrations/cursor/mcp.json). See [Cursor's official plugin template](https://github.com/cursor/plugin-template) and [MCP documentation](https://docs.cursor.com/context/model-context-protocol).

## Google Antigravity

`setup --host antigravity` installs a complete `plugin.json`, `mcp_config.json`, and Skill bundle in Antigravity CLI and IDE user locations. `--scope project` writes `.agents/plugins/anno`. The fallback is [`plugins/anno/integrations/antigravity/mcp_config.json`](../plugins/anno/integrations/antigravity/mcp_config.json). See [Antigravity Plugins & Skills](https://antigravity.google/docs/cli/plugins) and [MCP documentation](https://antigravity.google/docs/mcp).

## Windsurf

`setup --host windsurf` merges `~/.codeium/windsurf/mcp_config.json` and installs `~/.codeium/windsurf/skills/anno/SKILL.md`. Project scope uses `.windsurf`. The fallback is [`plugins/anno/integrations/windsurf/mcp_config.json`](../plugins/anno/integrations/windsurf/mcp_config.json). See [Windsurf MCP documentation](https://docs.windsurf.com/windsurf/cascade/mcp).

## GitHub Copilot

Copilot CLI can install the entire plugin directly:

```bash
copilot plugin install philmingdao/anno:plugins/anno
```

Alternatively, `setup --host copilot` safely merges user or project configuration. Manual fallbacks are [`plugins/anno/integrations/github-copilot/mcp-config.json`](../plugins/anno/integrations/github-copilot/mcp-config.json) and [`plugins/anno/integrations/github-copilot/vscode-mcp.json`](../plugins/anno/integrations/github-copilot/vscode-mcp.json). See GitHub's [CLI plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference) and [MCP documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers).

GitHub's cloud coding agent cannot expose Anno's loopback URL to the user's browser; use a local Copilot CLI or IDE session.

## DeepSeek Harness

Anno's maintained DeepSeek solution lives in the independent [`philmingdao/anno-dsh-native`](https://github.com/philmingdao/anno-dsh-native) repository. It is an in-process Cordis plug-in built with DeepSeek Harness itself: it joins the DSH profile, tool registry, system prompt, and `agent.followup` lifecycle directly. It does not run the shared MCP server or an MCP bridge.

```bash
dsh plugin --profile web add github:philmingdao/anno-dsh-native
dsh web
```

The default profile is `web`; select another with `--profile`. See the [native plug-in repository](https://github.com/philmingdao/anno-dsh-native) for its architecture, source installation, and uninstall steps. DeepSeek Harness itself remains a developer preview, so the plug-in currently declares and tests `>=0.1.0-rc.6 <0.2.0` rather than following unverified releases automatically.

## Meta Muse Code

Muse Code remains experimental because a stable public MCP configuration path is not documented. Confirm the path in the installed build, then run:

```bash
npx -y @philmingdao/anno@0.4.0 setup --host muse --config /absolute/path/to/mcp.json
```

The conventional fallback is [`plugins/anno/integrations/muse-code/mcp.json`](../plugins/anno/integrations/muse-code/mcp.json).

## Generic MCP clients and registries

Any stdio client can launch `npx -y @philmingdao/anno@0.4.0 mcp`. The package declares MCP Registry name `io.github.philmingdao/anno`, and `plugins/anno/server.json` describes the npm transport for publication to the official MCP Registry.

## Security and trust

Review MCP configuration before enabling it. Anno accesses only HTML files explicitly opened through its tools, binds the editor to `127.0.0.1`, validates request origins, never overwrites the source file, and does not upload reviewed files.
