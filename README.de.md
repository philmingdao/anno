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

## Installation in Codex

```bash
codex plugin marketplace add philmingdao/anno --ref main
codex plugin add anno@anno
```

Ersetzen Sie für reproduzierbare Installationen `main` durch ein Release-Tag wie `v0.3.0`.

## Installation in Claude Code

```text
/plugin marketplace add philmingdao/anno
/plugin install anno@anno
```

## Installation in WorkBuddy oder CodeBuddy

Fügen Sie `philmingdao/anno` als Plugin-Marketplace hinzu und installieren Sie anschließend `anno`. Für die lokale Entwicklung kann `plugins/anno` über die Plugin-Verzeichnisoption des Hosts geladen werden.

## MCP-Server direkt verwenden

Nach Veröffentlichung des npm-Pakets kann jeder stdio-MCP-Client Anno so starten:

```bash
npx -y @philmingdao/anno
```

Bis dahin klonen Sie das Repository, installieren die Abhängigkeiten, erstellen den Build und verweisen den MCP-Client auf `plugins/anno/dist/index.js`.

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
