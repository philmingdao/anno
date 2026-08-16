import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const pluginRoot = join(root, "plugins", "anno");
const requiredFiles = [
  ".mcp.json",
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  ".codebuddy-plugin/plugin.json",
  ".workbuddy-plugin/plugin.json",
  ".cursor-plugin/plugin.json",
  "LICENSE",
  "README.md",
  "mcp.json",
  "package.json",
  "server.json",
  "host-plugins/antigravity/plugin.json",
  "host-plugins/antigravity/mcp_config.json",
  "host-plugins/antigravity/skills/review-html-artifacts/SKILL.md",
  "integrations/cursor/mcp.json",
  "integrations/antigravity/mcp_config.json",
  "integrations/windsurf/mcp_config.json",
  "integrations/github-copilot/mcp-config.json",
  "integrations/github-copilot/vscode-mcp.json",
  "integrations/muse-code/mcp.json",
  "skills/review-html-artifacts/SKILL.md",
];

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

await Promise.all(requiredFiles.map((path) => access(join(pluginRoot, path))));

const packageJson = await readJson(join(pluginRoot, "package.json"));
const manifests = await Promise.all(
  [".codex-plugin", ".claude-plugin", ".codebuddy-plugin", ".workbuddy-plugin", ".cursor-plugin"].map(
    (directory) => readJson(join(pluginRoot, directory, "plugin.json")),
  ),
);

for (const manifest of manifests) {
  if (manifest.name !== "anno") throw new Error("Every host manifest must use the name 'anno'.");
  if (manifest.version !== packageJson.version) {
    throw new Error(`Manifest version ${manifest.version} does not match ${packageJson.version}.`);
  }
  if (manifest.license !== "MIT") throw new Error("Every host manifest must declare MIT.");
}

for (const marketplacePath of [
  ".agents/plugins/marketplace.json",
  ".claude-plugin/marketplace.json",
  ".codebuddy-plugin/marketplace.json",
  ".cursor-plugin/marketplace.json",
]) {
  const marketplace = await readJson(join(root, marketplacePath));
  const anno = marketplace.plugins?.find((plugin) => plugin.name === "anno");
  if (!anno) throw new Error(`${marketplacePath} does not list Anno.`);
}

const integrationPaths = requiredFiles.filter((path) => path.startsWith("integrations/"));
for (const integrationPath of integrationPaths) {
  const config = await readJson(join(pluginRoot, integrationPath));
  const servers = config.mcpServers ?? config.servers;
  const anno = servers?.anno;
  if (!anno || anno.command !== "npx") throw new Error(`${integrationPath} does not define the published Anno stdio server.`);
  if (!anno.args?.includes("@philmingdao/anno@0.4.0")) throw new Error(`${integrationPath} does not pin Anno 0.4.0.`);
  if (!anno.env?.ANNO_HOST) throw new Error(`${integrationPath} does not select an Anno host.`);
}

const serverJson = await readJson(join(pluginRoot, "server.json"));
if (serverJson.name !== packageJson.mcpName) throw new Error("server.json name must match package.json mcpName.");
if (serverJson.version !== packageJson.version) throw new Error("server.json version must match package.json.");
if (serverJson.packages?.[0]?.identifier !== packageJson.name) throw new Error("server.json must publish the Anno npm package.");

const readmePaths = [
  "README.md",
  "README.zh-CN.md",
  "README.ja.md",
  "README.ko.md",
  "README.fr.md",
  "README.es.md",
  "README.de.md",
  "README.it.md",
  "README.pt.md",
  "README.th.md",
];
const readmeIntegrationTargets = [
  "plugins/anno/integrations/cursor/mcp.json",
  "plugins/anno/integrations/antigravity/mcp_config.json",
  "plugins/anno/integrations/windsurf/mcp_config.json",
  "plugins/anno/integrations/github-copilot/mcp-config.json",
  "plugins/anno/integrations/github-copilot/vscode-mcp.json",
  "plugins/anno/integrations/muse-code/mcp.json",
];
await Promise.all(readmePaths.map((path) => access(join(root, path))));
for (const readmePath of readmePaths) {
  const contents = await readFile(join(root, readmePath), "utf8");
  for (const target of readmePaths) {
    if (target !== readmePath && !contents.includes(`href="${target}"`)) {
      throw new Error(`${readmePath} does not link to ${target}.`);
    }
  }
  for (const target of readmeIntegrationTargets) {
    if (!contents.includes(`](${target})`)) {
      throw new Error(`${readmePath} does not document ${target}.`);
    }
  }
}

console.log(`Validated Anno ${packageJson.version} manifests and required files.`);
