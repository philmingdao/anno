# DeepSeek Harness adapter status

DeepSeek Harness is currently a developer preview and explicitly permits compatibility-breaking plugin changes. Anno 0.2 includes an experimental Cordis bundle that starts the shared Anno MCP server and maps its discovered MCP tools into the DSH tool registry.

The adapter depends on `@philmingdao/anno`, registers Anno tools with the DSH tool registry, exposes the local review URL through normal tool output, and uses the same durable `needs_agent` handoff contract. It does not fork the editor or session implementation.

The package remains private and experimental until it is validated against a released DSH plugin SDK whose npm types match the current Harness source. Use it from a source checkout and expect changes between DSH release candidates.
