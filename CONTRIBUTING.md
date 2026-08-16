# Contributing

Issues and focused pull requests are welcome. Do not include private HTML documents, review sessions, credentials, or generated dependency directories.

Before submitting a change:

```bash
npm install
npm test
npm run pack:check
```

Changes to session states or handoff behavior must preserve source immutability, exact handoff claiming, and compatibility with legacy `needs_codex` sessions unless a documented major release removes that support.
