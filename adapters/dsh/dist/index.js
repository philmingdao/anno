import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { access, copyFile, mkdir, mkdtemp, readFile, readdir, rename, rm, stat } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
export const ANNO_DSH_VERSION = '0.1.0';
export const ANNO_DSH_PACKAGE = `@philmingdao/anno-dsh@${ANNO_DSH_VERSION}`;
export const ANNO_VERSION = '0.4.0';
export const ANNO_PACKAGE = `@philmingdao/anno@${ANNO_VERSION}`;
export const DSH_VERSION = '0.1.0-rc.6';
const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL_ROOT = path.join(PACKAGE_ROOT, 'skills', 'review-html-artifacts');
function profileName(options) {
    const profile = options.profile ?? 'web';
    if (!/^[A-Za-z0-9._-]+$/.test(profile)) {
        throw new Error('DSH profile names may contain only letters, numbers, dot, underscore, and hyphen.');
    }
    return profile;
}
function resolvedDshHome(options) {
    return path.resolve(options.dshHome ?? process.env.DSH_HOME ?? path.join(homedir(), '.dsh'));
}
function commandExists(command) {
    const probe = process.platform === 'win32' ? 'where' : 'which';
    return spawnSync(probe, [command], { stdio: 'ignore' }).status === 0;
}
function dshCommand() {
    if (commandExists('dsh'))
        return { command: 'dsh', prefix: [] };
    if (!commandExists('npx'))
        throw new Error('Neither dsh nor npx was found. Install Node.js 22 or newer first.');
    return { command: 'npx', prefix: ['-y', `--package=@deepseek-ai/dsh@${DSH_VERSION}`, 'dsh'] };
}
function runDsh(args, options, capture = false) {
    const command = dshCommand();
    if (options.dryRun)
        return '';
    const result = spawnSync(command.command, [...command.prefix, ...args], {
        encoding: capture ? 'utf8' : undefined,
        stdio: capture ? 'pipe' : 'inherit',
        shell: process.platform === 'win32',
        env: { ...process.env, DSH_HOME: resolvedDshHome(options) },
    });
    if (result.error)
        throw result.error;
    if (result.status !== 0) {
        const detail = capture && typeof result.stderr === 'string' && result.stderr.trim()
            ? `\n${result.stderr.trim()}`
            : '';
        throw new Error(`${command.command} ${[...command.prefix, ...args].join(' ')} failed with exit code ${result.status ?? 'unknown'}.${detail}`);
    }
    return capture && typeof result.stdout === 'string' ? result.stdout : '';
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
function timestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
}
async function copyTree(source, destination) {
    await mkdir(destination, { recursive: true });
    for (const entry of await readdir(source, { withFileTypes: true })) {
        const from = path.join(source, entry.name);
        const to = path.join(destination, entry.name);
        if (entry.isDirectory())
            await copyTree(from, to);
        else if (entry.isFile())
            await copyFile(from, to);
    }
}
async function sameTree(left, right) {
    if (!(await exists(left)) || !(await exists(right)))
        return false;
    const leftEntries = await readdir(left, { withFileTypes: true });
    const rightEntries = await readdir(right, { withFileTypes: true });
    if (leftEntries.length !== rightEntries.length)
        return false;
    const rightNames = new Set(rightEntries.map(entry => `${entry.isDirectory() ? 'd' : 'f'}:${entry.name}`));
    for (const entry of leftEntries) {
        if (!rightNames.has(`${entry.isDirectory() ? 'd' : 'f'}:${entry.name}`))
            return false;
        const leftPath = path.join(left, entry.name);
        const rightPath = path.join(right, entry.name);
        if (entry.isDirectory()) {
            if (!(await sameTree(leftPath, rightPath)))
                return false;
        }
        else if (entry.isFile()) {
            if ((await readFile(leftPath)).compare(await readFile(rightPath)) !== 0)
                return false;
        }
    }
    return true;
}
async function installSkill(options) {
    const target = path.join(resolvedDshHome(options), 'skills', 'review-html-artifacts');
    if (await sameTree(SKILL_ROOT, target))
        return { action: 'unchanged', target };
    const hadTarget = await exists(target);
    const backup = hadTarget ? `${target}.anno-backup-${timestamp()}` : undefined;
    if (!options.dryRun) {
        await mkdir(path.dirname(target), { recursive: true });
        if (backup)
            await rename(target, backup);
        const temporary = `${target}.anno-tmp-${process.pid}`;
        await rm(temporary, { recursive: true, force: true });
        await copyTree(SKILL_ROOT, temporary);
        await rename(temporary, target);
    }
    return { action: hadTarget ? 'updated' : 'created', target, ...(backup ? { backup } : {}) };
}
async function uninstallSkill(options) {
    const target = path.join(resolvedDshHome(options), 'skills', 'review-html-artifacts');
    if (!(await exists(target)))
        return { action: 'unchanged', target };
    if (!(await sameTree(SKILL_ROOT, target)) && !options.force)
        return { action: 'preserved', target };
    const backup = `${target}.anno-backup-${timestamp()}`;
    if (!options.dryRun)
        await rename(target, backup);
    return { action: 'removed', target, backup };
}
function profileManifest(options) {
    return path.join(resolvedDshHome(options), 'profiles', profileName(options), 'package.json');
}
async function verifyProfile(options) {
    const manifestPath = profileManifest(options);
    if (!(await exists(manifestPath)))
        throw new Error(`DSH profile manifest is missing: ${manifestPath}`);
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    if (!manifest.dependencies?.['@philmingdao/anno-dsh']) {
        throw new Error(`DSH profile ${profileName(options)} does not depend on @philmingdao/anno-dsh.`);
    }
    if (!manifest.dsh?.profile?.bundles?.includes('@philmingdao/anno-dsh')) {
        throw new Error(`DSH profile ${profileName(options)} has not activated the Anno bundle.`);
    }
    const dump = runDsh(['--profile', profileName(options), '--dump-config'], options, true);
    for (const required of ['@philmingdao/anno-dsh', '@deepseek-ai/dsh-mcp-client', 'serverName: anno']) {
        if (!dump.includes(required))
            throw new Error(`DSH composed config is missing ${required}.`);
    }
    return [
        { action: 'verified', target: manifestPath },
        { action: 'verified', target: `DSH profile ${profileName(options)} composed Anno through dsh-mcp-client` },
    ];
}
async function withTimeout(operation, label, milliseconds = 20_000) {
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
async function verifyMcp() {
    const stateRoot = await mkdtemp(path.join(tmpdir(), 'anno-dsh-doctor-'));
    const transport = new StdioClientTransport({
        command: 'npx',
        args: ['-y', `--package=${ANNO_PACKAGE}`, 'anno', 'mcp'],
        env: {
            ...process.env,
            ANNO_HOST: 'dsh',
            ANNO_DATA_DIR: stateRoot,
            ANNO_DISABLE_CODEX_FALLBACK: '1',
        },
        stderr: 'pipe',
    });
    const client = new Client({ name: 'anno-dsh-doctor', version: ANNO_DSH_VERSION });
    try {
        await withTimeout(client.connect(transport), 'Anno DSH MCP initialize');
        const listed = await withTimeout(client.listTools(), 'Anno DSH MCP tools/list');
        const names = new Set(listed.tools.map(tool => tool.name));
        for (const required of ['html_review_start_session', 'html_review_get_session', 'html_review_register_final']) {
            if (!names.has(required))
                throw new Error(`Anno DSH MCP doctor failed: ${required} is missing.`);
        }
    }
    finally {
        await client.close().catch(() => undefined);
        await transport.close().catch(() => undefined);
        await rm(stateRoot, { recursive: true, force: true });
    }
    return { action: 'verified', target: 'Anno MCP initialize + tools/list for ANNO_HOST=dsh' };
}
export async function install(options = {}) {
    const profile = profileName(options);
    const packageSpec = options.packageSpec ?? ANNO_DSH_PACKAGE;
    runDsh(['plugin', '--profile', profile, 'add', packageSpec], options);
    const changes = [
        { action: 'command', target: `dsh plugin --profile ${profile} add ${packageSpec}` },
        await installSkill(options),
    ];
    if (!options.skipDoctor && !options.dryRun)
        changes.push(...await doctor(options));
    return changes;
}
export async function update(options = {}) {
    return install(options);
}
export async function uninstall(options = {}) {
    const profile = profileName(options);
    runDsh(['plugin', '--profile', profile, 'remove', '@philmingdao/anno-dsh'], options);
    return [
        { action: 'command', target: `dsh plugin --profile ${profile} remove @philmingdao/anno-dsh` },
        await uninstallSkill(options),
    ];
}
export async function doctor(options = {}) {
    const skill = path.join(resolvedDshHome(options), 'skills', 'review-html-artifacts', 'SKILL.md');
    if (!(await exists(skill)))
        throw new Error(`Anno DSH skill is missing: ${skill}`);
    const skillStat = await stat(skill);
    if (!skillStat.isFile())
        throw new Error(`Anno DSH skill is not a file: ${skill}`);
    return [
        ...await verifyProfile(options),
        { action: 'verified', target: skill },
        await verifyMcp(),
    ];
}
//# sourceMappingURL=index.js.map