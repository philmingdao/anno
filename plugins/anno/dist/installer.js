import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { applyEdits, modify, parse } from 'jsonc-parser';
import { access, chmod, copyFile, mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
export const ANNO_VERSION = '0.4.0';
export const ANNO_PACKAGE = `@philmingdao/anno@${ANNO_VERSION}`;
const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL_SOURCE = path.join(PLUGIN_ROOT, 'skills', 'review-html-artifacts', 'SKILL.md');
const DEFAULT_PROJECT = process.cwd();
function resolvedHome(options) {
    return path.resolve(options.home ?? homedir());
}
function resolvedProject(options) {
    return path.resolve(options.projectDir ?? DEFAULT_PROJECT);
}
function npxServer(host) {
    const common = {
        command: 'npx',
        args: ['-y', ANNO_PACKAGE, 'mcp'],
        env: { ANNO_HOST: host },
    };
    return host === 'copilot' ? { type: 'local', ...common, tools: ['*'] } : common;
}
function jsonTarget(host, options) {
    const home = resolvedHome(options);
    const project = resolvedProject(options);
    const user = options.scope === 'user';
    switch (host) {
        case 'cursor':
            return {
                file: user ? path.join(home, '.cursor', 'mcp.json') : path.join(project, '.cursor', 'mcp.json'),
                jsonPath: ['mcpServers', 'anno'],
                value: npxServer(host),
            };
        case 'windsurf':
            return {
                file: user ? path.join(home, '.codeium', 'windsurf', 'mcp_config.json') : path.join(project, '.windsurf', 'mcp_config.json'),
                jsonPath: ['mcpServers', 'anno'],
                value: npxServer(host),
            };
        case 'copilot':
            return {
                file: user ? path.join(home, '.copilot', 'mcp-config.json') : path.join(project, '.mcp.json'),
                jsonPath: ['mcpServers', 'anno'],
                value: npxServer(host),
            };
        case 'muse':
            if (!options.customConfig)
                return undefined;
            return {
                file: path.resolve(options.customConfig),
                jsonPath: ['mcpServers', 'anno'],
                value: npxServer(host),
            };
        default:
            return undefined;
    }
}
function skillTarget(host, options) {
    const home = resolvedHome(options);
    const project = resolvedProject(options);
    const user = options.scope === 'user';
    switch (host) {
        case 'cursor':
            return path.join(user ? path.join(home, '.cursor') : path.join(project, '.cursor'), 'skills', 'anno', 'SKILL.md');
        case 'windsurf':
            return path.join(user ? path.join(home, '.codeium', 'windsurf') : path.join(project, '.windsurf'), 'skills', 'anno', 'SKILL.md');
        case 'copilot':
            return path.join(user ? path.join(home, '.copilot') : path.join(project, '.github'), 'skills', 'anno', 'SKILL.md');
        case 'muse':
            return path.join(user ? path.join(home, '.agents') : path.join(project, '.agents'), 'skills', 'anno', 'SKILL.md');
        default:
            return undefined;
    }
}
function antigravityRoots(options) {
    if (options.scope === 'project') {
        return [path.join(resolvedProject(options), '.agents', 'plugins', 'anno')];
    }
    const home = resolvedHome(options);
    return [
        path.join(home, '.gemini', 'config', 'plugins', 'anno'),
        path.join(home, '.gemini', 'antigravity-cli', 'plugins', 'anno'),
    ];
}
function timestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
}
async function exists(target) {
    try {
        await access(target, fsConstants.F_OK);
        return true;
    }
    catch {
        return false;
    }
}
async function backupFile(target, dryRun) {
    if (!(await exists(target)))
        return undefined;
    const backup = `${target}.anno-backup-${timestamp()}`;
    if (!dryRun)
        await copyFile(target, backup);
    return backup;
}
async function atomicWrite(target, content, dryRun) {
    if (dryRun)
        return;
    await mkdir(path.dirname(target), { recursive: true });
    const temporary = `${target}.anno-tmp-${process.pid}`;
    let mode;
    try {
        mode = (await stat(target)).mode;
    }
    catch {
        mode = undefined;
    }
    await writeFile(temporary, content, 'utf8');
    if (mode !== undefined)
        await chmod(temporary, mode);
    await rename(temporary, target);
}
async function updateJson(target, removeEntry, dryRun) {
    const hadFile = await exists(target.file);
    const original = hadFile ? await readFile(target.file, 'utf8') : '{}\n';
    const errors = [];
    parse(original, errors, { allowTrailingComma: true, disallowComments: false });
    if (errors.length > 0) {
        throw new Error(`Cannot safely edit ${target.file}: invalid JSON/JSONC at offset ${errors[0]?.offset ?? 0}.`);
    }
    const edits = modify(original, target.jsonPath, removeEntry ? undefined : target.value, {
        formattingOptions: { insertSpaces: true, tabSize: 2, eol: original.includes('\r\n') ? '\r\n' : '\n' },
    });
    const updated = applyEdits(original, edits);
    if (updated === original)
        return { host: 'cursor', action: 'unchanged', target: target.file };
    const backup = await backupFile(target.file, dryRun);
    await atomicWrite(target.file, updated.endsWith('\n') ? updated : `${updated}\n`, dryRun);
    return {
        host: 'cursor',
        action: removeEntry ? 'removed' : hadFile ? 'updated' : 'created',
        target: target.file,
        ...(backup ? { backup } : {}),
    };
}
async function installSkill(host, target, dryRun) {
    const source = await readFile(SKILL_SOURCE, 'utf8');
    let original;
    try {
        original = await readFile(target, 'utf8');
    }
    catch {
        original = undefined;
    }
    if (original === source)
        return { host, action: 'unchanged', target };
    const backup = original === undefined ? undefined : await backupFile(target, dryRun);
    await atomicWrite(target, source, dryRun);
    return { host, action: original === undefined ? 'created' : 'updated', target, ...(backup ? { backup } : {}) };
}
async function removeSkill(host, target, dryRun) {
    if (!(await exists(target)))
        return { host, action: 'unchanged', target };
    const backup = await backupFile(target, dryRun);
    if (!dryRun)
        await rm(path.dirname(target), { recursive: true, force: true });
    return { host, action: 'removed', target: path.dirname(target), ...(backup ? { backup } : {}) };
}
async function installAntigravity(options, removeEntry) {
    const changes = [];
    const skill = await readFile(SKILL_SOURCE, 'utf8');
    for (const root of antigravityRoots(options)) {
        const manifest = path.join(root, 'plugin.json');
        const config = path.join(root, 'mcp_config.json');
        const skillPath = path.join(root, 'skills', 'review-html-artifacts', 'SKILL.md');
        if (removeEntry) {
            if (await exists(root)) {
                const backup = await backupFile(manifest, Boolean(options.dryRun));
                if (!options.dryRun)
                    await rm(root, { recursive: true, force: true });
                changes.push({ host: 'antigravity', action: 'removed', target: root, ...(backup ? { backup } : {}) });
            }
            else {
                changes.push({ host: 'antigravity', action: 'unchanged', target: root });
            }
            continue;
        }
        const manifestContents = `${JSON.stringify({
            $schema: 'https://antigravity.google/schemas/v1/plugin.json',
            name: 'anno',
            description: 'Local-first HTML review and annotation workflow for AI agents.',
        }, null, 2)}\n`;
        const configContents = `${JSON.stringify({ mcpServers: { anno: npxServer('antigravity') } }, null, 2)}\n`;
        for (const [target, contents] of [[manifest, manifestContents], [config, configContents], [skillPath, skill]]) {
            let current;
            try {
                current = await readFile(target, 'utf8');
            }
            catch {
                current = undefined;
            }
            if (current === contents) {
                changes.push({ host: 'antigravity', action: 'unchanged', target });
                continue;
            }
            const backup = current === undefined ? undefined : await backupFile(target, Boolean(options.dryRun));
            await atomicWrite(target, contents, Boolean(options.dryRun));
            changes.push({ host: 'antigravity', action: current === undefined ? 'created' : 'updated', target, ...(backup ? { backup } : {}) });
        }
    }
    return changes;
}
function commandExists(command) {
    const probe = process.platform === 'win32' ? 'where' : 'which';
    return spawnSync(probe, [command], { stdio: 'ignore' }).status === 0;
}
function run(command, args, dryRun) {
    if (dryRun)
        return;
    const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
    if (result.status !== 0)
        throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status ?? 'unknown'}.`);
}
function readCommandJson(command, args) {
    const result = spawnSync(command, args, { encoding: 'utf8', shell: process.platform === 'win32' });
    if (result.status !== 0)
        return undefined;
    try {
        return JSON.parse(result.stdout);
    }
    catch {
        return undefined;
    }
}
async function withTimeout(operation, label, milliseconds = 15_000) {
    let timer;
    try {
        return await Promise.race([
            operation,
            new Promise((_, reject) => {
                timer = setTimeout(() => reject(new Error(`${label} timed out after ${milliseconds / 1000} seconds.`)), milliseconds);
            }),
        ]);
    }
    finally {
        if (timer)
            clearTimeout(timer);
    }
}
function installNativeHost(host, options, removeEntry) {
    if (!commandExists(host))
        throw new Error(`${host} executable was not found. Install ${host} first, then rerun Anno setup.`);
    const dryRun = Boolean(options.dryRun);
    if (host === 'codex') {
        if (removeEntry) {
            run('codex', ['plugin', 'remove', 'anno@anno', '--json'], dryRun);
            return [{ host, action: 'command', target: 'codex plugin remove anno@anno' }];
        }
        const marketplaceState = readCommandJson('codex', ['plugin', 'marketplace', 'list', '--json']);
        if (marketplaceState?.marketplaces?.some(item => item.name === 'anno')) {
            run('codex', ['plugin', 'marketplace', 'upgrade', 'anno', '--json'], dryRun);
        }
        else {
            run('codex', ['plugin', 'marketplace', 'add', 'philmingdao/anno', '--ref', `v${ANNO_VERSION}`, '--json'], dryRun);
        }
        const pluginState = readCommandJson('codex', ['plugin', 'list', '--json']);
        const conflicting = pluginState?.installed?.find(item => item.name === 'anno' && item.pluginId !== 'anno@anno');
        if (conflicting && !options.force) {
            throw new Error(`Codex already has ${conflicting.pluginId}. Use --force only after deciding which Anno installation should be active.`);
        }
        if (!pluginState?.installed?.some(item => item.pluginId === 'anno@anno')) {
            run('codex', ['plugin', 'add', 'anno@anno', '--json'], dryRun);
        }
        return [{ host, action: 'command', target: 'anno@anno' }];
    }
    if (host === 'claude') {
        if (removeEntry) {
            run('claude', ['plugin', 'uninstall', 'anno@anno', '--scope', options.scope], dryRun);
            return [{ host, action: 'command', target: 'claude plugin uninstall anno@anno' }];
        }
        const marketplaces = readCommandJson('claude', ['plugin', 'marketplace', 'list', '--json']);
        if (marketplaces?.some(item => item.name === 'anno')) {
            run('claude', ['plugin', 'marketplace', 'update', 'anno'], dryRun);
        }
        else {
            run('claude', ['plugin', 'marketplace', 'add', `https://github.com/philmingdao/anno.git#v${ANNO_VERSION}`], dryRun);
        }
        run('claude', ['plugin', 'install', 'anno@anno', '--scope', options.scope], dryRun);
        return [{ host, action: 'command', target: 'anno@anno' }];
    }
    if (removeEntry) {
        run(host, ['plugin', 'uninstall', 'anno@anno'], dryRun);
        return [{ host, action: 'command', target: `${host} plugin uninstall anno@anno` }];
    }
    run(host, ['plugin', 'marketplace', 'add', `https://github.com/philmingdao/anno.git#v${ANNO_VERSION}`], dryRun);
    run(host, ['plugin', 'install', 'anno@anno'], dryRun);
    return [{ host, action: 'command', target: 'anno@anno' }];
}
async function applyHost(host, options, removeEntry) {
    if (host === 'codex' || host === 'claude' || host === 'workbuddy' || host === 'codebuddy') {
        return installNativeHost(host, options, removeEntry);
    }
    if (host === 'antigravity')
        return installAntigravity(options, removeEntry);
    const target = jsonTarget(host, options);
    if (!target) {
        throw new Error(host === 'muse'
            ? 'Muse Code support is experimental. Pass --config /absolute/path/to/its/mcp.json after confirming the installed build\'s config location.'
            : `No installation adapter exists for ${host}.`);
    }
    const jsonChange = await updateJson(target, removeEntry, Boolean(options.dryRun));
    jsonChange.host = host;
    const skill = skillTarget(host, options);
    const changes = [jsonChange];
    if (skill)
        changes.push(removeEntry
            ? await removeSkill(host, skill, Boolean(options.dryRun))
            : await installSkill(host, skill, Boolean(options.dryRun)));
    return changes;
}
export async function setup(options) {
    const changes = [];
    for (const host of options.hosts)
        changes.push(...await applyHost(host, options, false));
    if (!options.skipDoctor && !options.dryRun)
        changes.push(...await doctor(options));
    return changes;
}
export async function uninstall(options) {
    const changes = [];
    for (const host of options.hosts)
        changes.push(...await applyHost(host, options, true));
    return changes;
}
export async function doctor(options) {
    const changes = [];
    for (const host of options.hosts) {
        if (host === 'antigravity') {
            for (const root of antigravityRoots(options)) {
                for (const required of ['plugin.json', 'mcp_config.json', path.join('skills', 'review-html-artifacts', 'SKILL.md')]) {
                    const target = path.join(root, required);
                    if (!(await exists(target)))
                        throw new Error(`Anno ${host} installation is incomplete: ${target} is missing.`);
                }
                changes.push({ host, action: 'verified', target: root });
            }
            continue;
        }
        const target = jsonTarget(host, options);
        if (target) {
            if (!(await exists(target.file)))
                throw new Error(`Anno ${host} configuration is missing: ${target.file}`);
            const parsed = parse(await readFile(target.file, 'utf8'));
            let cursor = parsed;
            for (const key of target.jsonPath)
                cursor = cursor?.[key];
            if (!cursor)
                throw new Error(`Anno ${host} entry is missing from ${target.file}.`);
            changes.push({ host, action: 'verified', target: target.file });
        }
    }
    const stateRoot = await mkdtemp(path.join(tmpdir(), 'anno-doctor-'));
    const env = { ...process.env, ANNO_HOST: 'generic', ANNO_DATA_DIR: stateRoot, ANNO_DISABLE_CODEX_FALLBACK: '1' };
    const transport = new StdioClientTransport({
        command: process.execPath,
        args: [path.join(PLUGIN_ROOT, 'dist', 'index.js')],
        env,
        stderr: 'pipe',
    });
    const client = new Client({ name: 'anno-doctor', version: ANNO_VERSION });
    try {
        await withTimeout(client.connect(transport), 'Anno MCP initialize');
        const listed = await withTimeout(client.listTools(), 'Anno MCP tools/list');
        const names = new Set(listed.tools.map(tool => tool.name));
        for (const required of ['html_review_start_session', 'html_review_get_session', 'html_review_register_final']) {
            if (!names.has(required))
                throw new Error(`Anno MCP doctor failed: ${required} is missing.`);
        }
    }
    finally {
        await client.close().catch(() => undefined);
        await transport.close().catch(() => undefined);
        await rm(stateRoot, { recursive: true, force: true });
    }
    changes.push({ host: options.hosts[0] ?? 'cursor', action: 'verified', target: 'MCP initialize + tools/list' });
    return changes;
}
export function detectedHosts(home = homedir()) {
    const detected = new Set();
    for (const host of ['codex', 'claude', 'workbuddy', 'codebuddy']) {
        if (commandExists(host))
            detected.add(host);
    }
    const paths = [
        ['cursor', path.join(home, '.cursor')],
        ['antigravity', path.join(home, '.gemini')],
        ['windsurf', path.join(home, '.codeium', 'windsurf')],
        ['copilot', path.join(home, '.copilot')],
    ];
    for (const [host, target] of paths) {
        if (spawnSync(process.execPath, ['-e', 'require("fs").accessSync(process.argv[1])', target], { stdio: 'ignore' }).status === 0)
            detected.add(host);
    }
    return [...detected];
}
//# sourceMappingURL=installer.js.map