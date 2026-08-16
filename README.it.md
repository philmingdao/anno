<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="plugins/anno/assets/logo-dark.svg">
    <img src="plugins/anno/assets/logo.svg" alt="Anno" width="240">
  </picture>
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <strong>Italiano</strong> · <a href="README.pt.md">Português</a> · <a href="README.th.md">ไทย</a>
</p>

# Anno

Anno è uno spazio di revisione HTML locale per agenti di programmazione IA. Apre nel browser una copia isolata di un file HTML locale e consente di modificare direttamente testo e formattazione, aggiungere commenti agli elementi e annotazioni di area e rivedere le presentazioni diapositiva per diapositiva. Al termine crea un passaggio di consegne persistente che un agente può prendere in carico e trasformare in un file HTML autonomo e verificato.

Il repository contiene un server MCP condiviso e uno Skill indipendente dall’host, manifest di plug-in nativi per gli host che li supportano e modelli MCP pronti da copiare per Cursor, Google Antigravity, Windsurf, GitHub Copilot e Meta Muse Code. Il supporto per DeepSeek Harness e Muse Code è sperimentale.

## Funzionalità principali

- Editor HTTP locale associato esclusivamente a `127.0.0.1`
- I file sorgente non vengono mai sovrascritti
- Modifica di testo, tipografia, colore, posizione, note di pagina e annotazioni di elementi o aree
- Passaggi di consegne persistenti e idempotenti
- Compatibilità con le sessioni `needs_codex` esistenti
- Implementazione condivisa di MCP e `SKILL.md` tra gli host supportati
- Interfaccia in cinese semplificato e inglese, con temi chiaro e scuro

## Requisiti

- Node.js 22 o versione successiva
- Un host che supporti server MCP stdio locali e l’accesso ai file locali
- Un browser per l’editor di revisione

## Strumenti agent supportati

Codex, Claude Code, WorkBuddy e CodeBuddy usano manifest di plug-in inclusi nel pacchetto. Cursor, Google Antigravity, Windsurf, GitHub Copilot CLI/Chat e Muse Code si collegano allo stesso server MCP stdio locale tramite modelli specifici per host. DeepSeek Harness usa un bridge nativo sperimentale.

Consulta la [guida alle integrazioni degli strumenti agent](docs/agent-tools.md) per le configurazioni pronte da copiare e i limiti di ogni host.

## Installazione in Codex

```bash
codex plugin marketplace add philmingdao/anno --ref main
codex plugin add anno@anno
```

Per installazioni riproducibili, sostituisci `main` con un tag di rilascio come `v0.3.0`.

## Installazione in Claude Code

```text
/plugin marketplace add philmingdao/anno
/plugin install anno@anno
```

## Installazione in WorkBuddy o CodeBuddy

Aggiungi `philmingdao/anno` come marketplace di plug-in, quindi installa `anno`. Durante lo sviluppo locale puoi caricare `plugins/anno` mediante l’opzione della directory dei plug-in dell’host.

## Uso diretto del server MCP

Dopo la pubblicazione del pacchetto npm, qualsiasi client MCP stdio potrà eseguire:

```bash
npx -y @philmingdao/anno
```

Fino ad allora, clona il repository, installa le dipendenze, compila il progetto e configura il client MCP affinché utilizzi `plugins/anno/dist/index.js`.

## Sviluppo

```bash
npm install
npm test
npm run pack:check
```

Il pacchetto pubblicabile si trova in `plugins/anno`. Le dipendenze generate e le sessioni di revisione locali non vengono incluse nei commit.

## Dati e privacy

Anno elabora localmente HTML e annotazioni. L’editor resta in ascolto solo sull’interfaccia di loopback e convalida le intestazioni Host e Origin. Gli host generici archiviano le sessioni in `~/.anno`; su macOS Codex mantiene il percorso compatibile `~/Library/Application Support/Codex/anno`. Usa `ANNO_DATA_DIR` per scegliere un’altra directory.

Anno non carica i file revisionati. L’host agent collegato può elaborare bozze e annotazioni in conformità con la propria politica sui dati.

## Compatibilità

Consulta la [documentazione sulla compatibilità](docs/compatibility.md) per il comportamento e i limiti specifici di ogni host.

## Licenza

Licenza MIT. Il font WDXL Lubrifont incluso resta soggetto alla propria SIL Open Font License separata in `plugins/anno/assets/OFL-WDXL-Lubrifont.txt`.
