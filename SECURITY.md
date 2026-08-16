# Security policy

Please report vulnerabilities privately through GitHub's security advisory feature for `philmingdao/anno` rather than opening a public issue.

Anno reads and writes local HTML files at paths explicitly supplied to its MCP tools. The review server binds to loopback, checks Host and Origin headers, uses per-session tokens for mutations, limits payload sizes, preserves source files, and versions output paths instead of overwriting existing files.

Install only releases or commits you trust. Plugin installations can execute the bundled local MCP server with the permissions granted by the host.
