# Anno for DeepSeek Harness

English | [简体中文](README.zh-CN.md)

`@philmingdao/anno-dsh` is the native DeepSeek Harness bundle for [Anno](https://github.com/philmingdao/anno), a local-first HTML review, editing, and annotation tool for coding agents.

It installs two coordinated pieces:

- a DSH profile bundle backed by the official `@deepseek-ai/dsh-mcp-client`;
- the `review-html-artifacts` skill under `$DSH_HOME/skills`, so the agent knows how to start, continue, and finish an Anno review.

## Compatibility

- DeepSeek Harness: `>=0.1.0-rc.6 <0.2.0`
- Node.js: 22 or newer
- Anno MCP server: `@philmingdao/anno@0.4.0`

DeepSeek Harness is still a developer preview and may make compatibility-breaking changes. This package pins the tested DSH and Anno ranges instead of claiming compatibility with untested releases.

## Install

Recommended one-command install into the default `web` profile:

```sh
npx -y @philmingdao/anno-dsh@0.1.0 install
```

The installer uses a global `dsh` command when available and otherwise runs the tested `@deepseek-ai/dsh@0.1.0-rc.6` through `npx`. It adds the bundle with DSH's native profile manager, installs the skill, composes the profile, and performs a real MCP `initialize` plus `tools/list` check.

Start Harness normally:

```sh
npx -y @deepseek-ai/dsh@0.1.0-rc.6 web
```

For a different profile or DSH home:

```sh
npx -y @philmingdao/anno-dsh@0.1.0 install --profile my-profile
npx -y @philmingdao/anno-dsh@0.1.0 install --dsh-home /absolute/path/to/.dsh
```

## Use

Ask Harness to open or review an HTML file. The DSH model-facing tools use its standard MCP namespace:

- `mcp__anno__html_review_start_session`
- `mcp__anno__html_review_get_session`
- `mcp__anno__html_review_claim_handoff`
- `mcp__anno__html_review_register_final`

Anno opens a local review URL, keeps the original file immutable, persists edits and annotations, and hands final generation back to the active agent.

## Verify, update, and remove

```sh
npx -y @philmingdao/anno-dsh@0.1.0 doctor
npx -y @philmingdao/anno-dsh@0.1.0 update
npx -y @philmingdao/anno-dsh@0.1.0 uninstall
```

Uninstall uses DSH's native `plugin remove`. The installed skill is moved to a timestamped backup instead of being deleted. If the skill was edited locally, uninstall preserves it unless `--force` is explicitly supplied.

## Native DSH installation

Experienced DSH users can add only the profile bundle:

```sh
dsh plugin --profile web add @philmingdao/anno-dsh@0.1.0
```

This activates the MCP bridge but does not copy the companion skill. The `anno-dsh install` command is recommended because it installs and verifies both parts.

## Source checkout

```sh
npm install
npm run build:dsh
node adapters/dsh/dist/cli.js install --package-spec ./adapters/dsh
```

Use `--dsh-home` with a temporary directory when testing without changing your normal Harness profiles.

## Architecture

```text
DSH profile
  -> @philmingdao/anno-dsh bundle
    -> @deepseek-ai/dsh-mcp-client
      -> npx --package=@philmingdao/anno@0.4.0 anno mcp
        -> local Anno review server and persisted session state
```

The adapter does not reimplement MCP discovery, tool naming, cancellation, HMR, or reconnect behavior. Those responsibilities remain with the official DSH MCP client.

## License

MIT
