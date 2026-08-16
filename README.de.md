<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="plugins/anno/assets/logo-dark.svg">
    <img src="plugins/anno/assets/logo.svg" alt="Anno" width="240">
  </picture>
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <strong>Deutsch</strong> · <a href="README.it.md">Italiano</a> · <a href="README.pt.md">Português</a> · <a href="README.th.md">ไทย</a>
</p>

# Anno

Anno ist ein lokal arbeitender HTML-Review-Arbeitsbereich für KI-Coding-Agenten. Er öffnet eine isolierte Kopie einer lokalen HTML-Datei im Browser und ermöglicht direkte Text- und Formatänderungen, Kommentare an Elementen, Bereichsanmerkungen sowie eine folienbezogene Prüfung. Nach Abschluss erstellt Anno eine dauerhafte Übergabe, die ein Agent übernehmen und in eine geprüfte, eigenständige HTML-Datei überführen kann.

Das Repository enthält einen gemeinsamen MCP-Server und einen hostneutralen Skill, native Plugin-Manifeste für unterstützte Hosts sowie kopierfertige MCP-Vorlagen für Cursor, Google Antigravity, Windsurf, GitHub Copilot und Meta Muse Code. Die Unterstützung für DeepSeek Harness und Muse Code ist experimentell.

## Highlights

- Lokaler HTTP-Editor, der ausschließlich an `127.0.0.1` gebunden ist
- Quelldateien werden niemals überschrieben
- Bearbeitung von Text, Typografie, Farbe, Position, Seitennotizen sowie Element- und Bereichsanmerkungen
- Dauerhafte, idempotente Agent-Übergaben
- Kompatibilität mit vorhandenen `needs_codex`-Sitzungen
- Gemeinsame MCP- und `SKILL.md`-Implementierung für unterstützte Hosts
- Benutzeroberfläche auf vereinfachtem Chinesisch und Englisch sowie helle und dunkle Designs

## Voraussetzungen

- Node.js 22 oder neuer
- Ein Host mit Unterstützung für lokale stdio-MCP-Server und lokale Dateien
- Ein Browser für den Review-Editor

## Unterstützte Agent-Tools

Codex, Claude Code, WorkBuddy und CodeBuddy verwenden paketierte Plugin-Manifeste. Cursor, Google Antigravity, Windsurf, GitHub Copilot CLI/Chat und Muse Code verbinden sich über hostspezifische Vorlagen mit demselben lokalen stdio-MCP-Server. DeepSeek Harness verwendet eine experimentelle native Bridge.

Kopierfertige Konfigurationen und hostspezifische Einschränkungen finden Sie im [Integrationsleitfaden für Agent-Tools](docs/agent-tools.md).

| Agent-Tool | Integration | Status |
| --- | --- | --- |
| Codex | Natives Plugin + MCP | Unterstützt |
| Claude Code | Natives Plugin + MCP | Unterstützt |
| WorkBuddy / CodeBuddy | Natives Plugin + MCP | Unterstützt |
| Cursor | Lokales stdio-MCP | Unterstützt |
| Google Antigravity | Lokales stdio-MCP | Unterstützt |
| Windsurf | Lokales stdio-MCP | Unterstützt |
| GitHub Copilot CLI / Chat | Lokales stdio-MCP | Lokal unterstützt |
| DeepSeek Harness | Cordis-to-MCP-Bridge | Experimentell |
| Meta Muse Code | Lokales stdio-MCP | Experimentell |

## Installation mit einem Befehl

Klonen und Build sind nicht nötig. Der Installer erkennt verfügbare Agenten, ergänzt nur den `anno`-Eintrag in vorhandenem JSON/JSONC, installiert Skill und MCP, erstellt ein Backup und prüft die Verbindung.

```bash
npx -y @philmingdao/anno@0.4.0 setup
npx -y @philmingdao/anno@0.4.0 setup --host cursor,windsurf,copilot
npx -y @philmingdao/anno@0.4.0 doctor --host cursor
```

Codex, Claude Code, WorkBuddy und CodeBuddy verwenden ihre nativen Plugins; Antigravity erhält ein vollständiges Plugin-Bundle. Für Muse Code geben Sie den bestätigten Konfigurationspfad an: `npx -y @philmingdao/anno@0.4.0 setup --host muse --config /absolute/path/to/mcp.json`.

Verwaltete Umgebungen können die folgenden versionsgebundenen Vorlagen verwenden.

| Agent-Tool | Vorlage | Konfigurationsziel |
| --- | --- | --- |
| Cursor | [`cursor/mcp.json`](plugins/anno/integrations/cursor/mcp.json) | Projektdatei `.cursor/mcp.json` oder `~/.cursor/mcp.json` |
| Google Antigravity | [`antigravity/mcp_config.json`](plugins/anno/integrations/antigravity/mcp_config.json) | Projektdatei `.agents/mcp_config.json` oder `~/.gemini/config/mcp_config.json` |
| Windsurf | [`windsurf/mcp_config.json`](plugins/anno/integrations/windsurf/mcp_config.json) | In `~/.codeium/windsurf/mcp_config.json` einfügen |
| GitHub Copilot CLI | [`github-copilot/mcp-config.json`](plugins/anno/integrations/github-copilot/mcp-config.json) | In `~/.copilot/mcp-config.json` einfügen |
| GitHub Copilot Chat in VS Code | [`github-copilot/vscode-mcp.json`](plugins/anno/integrations/github-copilot/vscode-mcp.json) | Projektdatei `.vscode/mcp.json` |
| Meta Muse Code | [`muse-code/mcp.json`](plugins/anno/integrations/muse-code/mcp.json) | Über den MCP-Manager der installierten Version importieren; experimentell |

Copilot CLI kann auch direkt konfiguriert werden:

```bash
copilot mcp add anno --env ANNO_HOST=copilot -- npx -y @philmingdao/anno@0.4.0 mcp
```

Starten Sie das Tool nach dem Speichern neu oder aktualisieren Sie seine MCP-Serverliste. Der GitHub Coding Agent in der Cloud kann Annos Loopback-URL nicht im Browser des Benutzers öffnen; verwenden Sie Copilot lokal. Muse Code bleibt experimentell, da sein öffentlicher MCP-Konfigurationsvertrag noch nicht stabil ist.

## MCP-Server direkt verwenden

Jeder stdio-MCP-Client kann Anno so starten:

```bash
npx -y @philmingdao/anno@0.4.0 mcp
```

## Entwicklung

```bash
npm install
npm test
npm run pack:check
```

Das veröffentlichbare Paket befindet sich in `plugins/anno`. Generierte Abhängigkeiten und lokale Review-Sitzungen werden nicht committed.

## Daten und Datenschutz

Anno verarbeitet HTML und Anmerkungen lokal. Der Editor bindet nur an die Loopback-Schnittstelle und prüft Host- und Origin-Header. Generische Hosts speichern Sitzungen unter `~/.anno`; Codex verwendet unter macOS weiterhin den kompatiblen Pfad `~/Library/Application Support/Codex/anno`. Mit `ANNO_DATA_DIR` kann ein anderes Verzeichnis gewählt werden.

Anno lädt überprüfte Dateien nicht hoch. Der verbundene Agent-Host kann Entwürfe und Anmerkungen gemäß seiner eigenen Datenrichtlinie verarbeiten.

## Kompatibilität

Hostabhängiges Verhalten und Einschränkungen sind in der [Kompatibilitätsdokumentation](docs/compatibility.md) beschrieben.

## Lizenz

MIT-Lizenz. Die enthaltene Schriftart WDXL Lubrifont unterliegt weiterhin ihrer separaten SIL Open Font License in `plugins/anno/assets/OFL-WDXL-Lubrifont.txt`.
