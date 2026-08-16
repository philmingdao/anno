<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="plugins/anno/assets/logo-dark.svg">
    <img src="plugins/anno/assets/logo.svg" alt="Anno" width="240">
  </picture>
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <strong>Français</strong> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.it.md">Italiano</a> · <a href="README.pt.md">Português</a> · <a href="README.th.md">ไทย</a>
</p>

# Anno

Anno est un espace local de révision HTML destiné aux agents de programmation IA. Il ouvre dans le navigateur une copie isolée d’un fichier HTML local, permet de modifier directement le texte et la mise en forme, d’ajouter des commentaires sur les éléments et des annotations de zone, et de réviser des présentations diapositive par diapositive. Une fois la révision terminée, Anno crée un transfert durable qu’un agent peut prendre en charge afin de produire un fichier HTML autonome et vérifié.

Ce dépôt contient un serveur MCP partagé et un Skill indépendant de l’hôte, des manifestes de plug-in natifs lorsque l’hôte les prend en charge, ainsi que des modèles MCP prêts à copier pour Cursor, Google Antigravity, Windsurf, GitHub Copilot et Meta Muse Code. La prise en charge de DeepSeek Harness et Muse Code est expérimentale.

## Fonctionnalités principales

- Éditeur HTTP local lié uniquement à `127.0.0.1`
- Les fichiers sources ne sont jamais écrasés
- Modification du texte, de la typographie, des couleurs, de la position, des notes de page et des annotations d’élément ou de zone
- Transferts d’agent durables et idempotents
- Compatibilité avec les sessions `needs_codex` existantes
- Implémentation MCP et `SKILL.md` partagée entre les hôtes compatibles
- Interface en chinois simplifié et en anglais, avec thèmes clair et sombre

## Prérequis

- Node.js 22 ou version ultérieure
- Un hôte prenant en charge les serveurs MCP stdio locaux et l’accès aux fichiers locaux
- Un navigateur pour l’éditeur de révision

## Outils d’agent pris en charge

Codex, Claude Code, WorkBuddy et CodeBuddy utilisent des manifestes de plug-in empaquetés. Cursor, Google Antigravity, Windsurf, GitHub Copilot CLI/Chat et Muse Code se connectent au même serveur MCP stdio local à l’aide de modèles propres à chaque hôte. DeepSeek Harness utilise un pont natif expérimental.

Consultez le [guide d’intégration des outils d’agent](docs/agent-tools.md) pour les configurations prêtes à copier et les limites de chaque hôte.

| Outil d’agent | Intégration | État |
| --- | --- | --- |
| Codex | Plug-in natif + MCP | Pris en charge |
| Claude Code | Plug-in natif + MCP | Pris en charge |
| WorkBuddy / CodeBuddy | Plug-in natif + MCP | Pris en charge |
| Cursor | MCP stdio local | Pris en charge |
| Google Antigravity | MCP stdio local | Pris en charge |
| Windsurf | MCP stdio local | Pris en charge |
| GitHub Copilot CLI / Chat | MCP stdio local | Pris en charge en local |
| DeepSeek Harness | Pont Cordis-to-MCP | Expérimental |
| Meta Muse Code | MCP stdio local | Expérimental |

## Installation dans Codex

```bash
codex plugin marketplace add philmingdao/anno --ref main
codex plugin add anno@anno
```

Pour une installation reproductible, remplacez `main` par une balise de version telle que `v0.3.1`.

## Installation dans Claude Code

```text
/plugin marketplace add philmingdao/anno
/plugin install anno@anno
```

## Installation dans WorkBuddy ou CodeBuddy

Ajoutez `philmingdao/anno` comme marketplace de plug-ins, puis installez `anno`. En développement local, chargez `plugins/anno` avec l’option de répertoire de plug-ins de l’hôte.

## Installation dans Cursor, Antigravity, Windsurf, Copilot ou Muse Code

Ces outils utilisent le même serveur MCP local. Jusqu’à la publication du paquet npm, préparez-le une seule fois :

```bash
git clone https://github.com/philmingdao/anno.git
cd anno
npm install
npm run build
```

Dans le modèle choisi, remplacez `/absolute/path/to/anno` par le chemin absolu du dépôt cloné, puis copiez ou fusionnez le fichier à l’emplacement indiqué :

| Outil d’agent | Modèle | Emplacement de configuration |
| --- | --- | --- |
| Cursor | [`cursor/mcp.json`](plugins/anno/integrations/cursor/mcp.json) | `.cursor/mcp.json` du projet ou `~/.cursor/mcp.json` |
| Google Antigravity | [`antigravity/mcp_config.json`](plugins/anno/integrations/antigravity/mcp_config.json) | `.agents/mcp_config.json` du projet ou `~/.gemini/config/mcp_config.json` |
| Windsurf | [`windsurf/mcp_config.json`](plugins/anno/integrations/windsurf/mcp_config.json) | Fusionner dans `~/.codeium/windsurf/mcp_config.json` |
| GitHub Copilot CLI | [`github-copilot/mcp-config.json`](plugins/anno/integrations/github-copilot/mcp-config.json) | Fusionner dans `~/.copilot/mcp-config.json` |
| GitHub Copilot Chat dans VS Code | [`github-copilot/vscode-mcp.json`](plugins/anno/integrations/github-copilot/vscode-mcp.json) | `.vscode/mcp.json` du projet |
| Meta Muse Code | [`muse-code/mcp.json`](plugins/anno/integrations/muse-code/mcp.json) | Importer via le gestionnaire MCP de la version installée ; expérimental |

Copilot CLI peut aussi être configuré directement :

```bash
copilot mcp add anno --env ANNO_HOST=copilot -- node /absolute/path/to/anno/plugins/anno/dist/index.js
```

Après l’enregistrement, redémarrez l’hôte ou actualisez sa liste de serveurs MCP. L’agent Coding Agent de GitHub dans le cloud ne peut pas exposer l’URL de boucle locale d’Anno ; utilisez Copilot en local. Muse Code reste expérimental car son contrat de configuration MCP public n’est pas encore stable.

## Utilisation directe du serveur MCP

Une fois le paquet npm publié, tout client MCP stdio pourra lancer :

```bash
npx -y @philmingdao/anno
```

D’ici là, clonez le dépôt, installez les dépendances, compilez le projet et configurez le client MCP pour utiliser `plugins/anno/dist/index.js`.

## Développement

```bash
npm install
npm test
npm run pack:check
```

Le paquet publiable se trouve dans `plugins/anno`. Les dépendances générées et les sessions de révision locales ne sont pas validées dans Git.

## Données et confidentialité

Anno traite localement le HTML et les annotations. L’éditeur écoute uniquement sur l’interface de bouclage et vérifie les en-têtes Host et Origin. Les hôtes génériques stockent les sessions dans `~/.anno` ; sous macOS, Codex conserve le chemin compatible `~/Library/Application Support/Codex/anno`. Utilisez `ANNO_DATA_DIR` pour choisir un autre répertoire.

Anno ne téléverse pas les fichiers révisés. L’hôte d’agent connecté peut traiter les brouillons et les annotations conformément à sa propre politique de données.

## Compatibilité

Consultez la [documentation de compatibilité](docs/compatibility.md) pour le comportement et les limites propres à chaque hôte.

## Licence

Licence MIT. La police WDXL Lubrifont incluse reste couverte par sa licence SIL Open Font License distincte dans `plugins/anno/assets/OFL-WDXL-Lubrifont.txt`.
