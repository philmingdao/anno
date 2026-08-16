# Compatibility

Anno separates its local editor and MCP session protocol from host-specific delivery behavior.

| Host | MCP tools | Shared skill | Embedded handoff UI | Automatic same-session follow-up |
| --- | --- | --- | --- | --- |
| Codex | Supported | Supported | Supported | Supported when a Codex thread id or host bridge is available |
| Claude Code | Supported | Supported | Host-dependent | Falls back to a durable handoff the user or agent resumes |
| WorkBuddy / CodeBuddy | Supported | Supported | Host-dependent | Falls back to a durable handoff the user or agent resumes |
| Cursor | Native plugin plus local stdio MCP | Installed as a Skill | Host-dependent | Durable manual resume |
| Google Antigravity | Native plugin plus local stdio MCP | Installed in the plugin bundle | Host-dependent | Durable manual resume |
| Windsurf | Supported through Cascade MCP | Installed as a Skill | Host-dependent | Durable manual resume |
| GitHub Copilot CLI / Chat | Native CLI plugin or local stdio MCP | Installed as a Skill | Host-dependent | Durable manual resume |
| Meta Muse Code | Experimental through local stdio MCP | Skill can be reused | Not verified | Durable manual resume |
| Generic MCP client | Supported | Optional | Not required | Manual resume |
| DeepSeek Harness | Experimental native bridge | Skill can be reused | Local URL only | Durable manual resume |

## Portable contract

New submissions use `needs_agent`. Anno still reads legacy `needs_codex` sessions. Every submission writes a draft, review payload, generation request, and unique handoff id before attempting host delivery. The receiving agent must claim the exact handoff before registering a final output.

The local editor URL works independently of embedded MCP UI support. Hosts that cannot open a browser should return the URL to the user without claiming it was opened.

## Host selection

Set `ANNO_HOST` to one of `codex`, `claude`, `codebuddy`, `workbuddy`, `cursor`, `antigravity`, `windsurf`, `copilot`, `muse`, `dsh`, or `generic`. Codex is detected automatically when `CODEX_THREAD_ID` or `CODEX_SESSION_ID` is present. The integration templates set this variable explicitly for other hosts. Only the Codex adapter invokes `codex exec resume`; other hosts never execute a different agent CLI.

Set `ANNO_DATA_DIR` to an absolute or user-relative storage location resolved by the launching shell. The legacy `ANNO_HOME` and `HTML_REVIEW_STUDIO_HOME` variables remain supported.

## Configuration templates

The recommended path is `npx -y @philmingdao/anno@0.4.0 setup`; it safely merges host configuration, installs the shared Skill, and verifies the MCP handshake. Version-pinned templates and host-specific limitations are documented in [Agent tool integrations](agent-tools.md).
