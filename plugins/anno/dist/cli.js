#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { ANNO_VERSION, detectedHosts, doctor, setup, uninstall, } from './installer.js';
const ALL_HOSTS = ['codex', 'claude', 'workbuddy', 'codebuddy', 'cursor', 'antigravity', 'windsurf', 'copilot', 'muse'];
function valueAfter(args, flag) {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
}
function parseHosts(value) {
    const requested = value.split(',').map(item => item.trim().toLowerCase()).filter(Boolean);
    if (requested.includes('all'))
        return ALL_HOSTS.filter(host => host !== 'muse');
    for (const host of requested) {
        if (!ALL_HOSTS.includes(host))
            throw new Error(`Unknown host: ${host}`);
    }
    return [...new Set(requested)];
}
async function chooseHosts(args) {
    const explicit = valueAfter(args, '--host') ?? valueAfter(args, '--hosts');
    if (explicit)
        return parseHosts(explicit);
    const detected = detectedHosts();
    if (!input.isTTY || !output.isTTY) {
        if (detected.length === 0)
            throw new Error('No hosts detected. Pass --host cursor,windsurf (or another comma-separated list).');
        return detected;
    }
    const rl = createInterface({ input, output });
    try {
        const suggested = detected.join(',') || 'cursor';
        const answer = await rl.question(`Agent tools to configure [${suggested}]: `);
        return parseHosts(answer.trim() || suggested);
    }
    finally {
        rl.close();
    }
}
async function optionsFrom(args) {
    const scopeValue = valueAfter(args, '--scope') ?? 'user';
    if (scopeValue !== 'user' && scopeValue !== 'project')
        throw new Error('--scope must be user or project.');
    const scope = scopeValue;
    const home = valueAfter(args, '--home');
    const projectDir = valueAfter(args, '--project');
    const customConfig = valueAfter(args, '--config');
    return {
        hosts: await chooseHosts(args),
        scope,
        ...(home ? { home } : {}),
        ...(projectDir ? { projectDir } : {}),
        ...(customConfig ? { customConfig } : {}),
        dryRun: args.includes('--dry-run'),
        force: args.includes('--force'),
        skipDoctor: args.includes('--skip-doctor'),
    };
}
function printChanges(changes) {
    for (const change of changes) {
        const backup = change.backup ? ` (backup: ${change.backup})` : '';
        console.log(`${change.host}: ${change.action} ${change.target}${backup}`);
    }
}
function usage() {
    console.log(`Anno ${ANNO_VERSION}\n\nUsage:\n  anno mcp\n  anno setup [--host cursor,windsurf] [--scope user|project] [--dry-run]\n  anno doctor [--host cursor,windsurf]\n  anno update [setup options]\n  anno uninstall [setup options]\n\nOptions:\n  --home PATH       Override the user home (also useful for CI)\n  --project PATH    Project root for project-scoped installs\n  --config PATH     Explicit MCP config path for experimental Muse Code support\n  --force           Allow a native-host installation conflict\n  --skip-doctor     Skip the post-install MCP handshake\n`);
}
const args = process.argv.slice(2);
const command = args[0] ?? 'mcp';
try {
    switch (command) {
        case 'mcp':
            await import('./index.js');
            break;
        case 'setup':
        case 'install':
        case 'update':
            printChanges(await setup(await optionsFrom(args.slice(1))));
            break;
        case 'doctor':
            printChanges(await doctor(await optionsFrom(args.slice(1))));
            break;
        case 'uninstall':
        case 'remove':
            printChanges(await uninstall(await optionsFrom(args.slice(1))));
            break;
        case '--version':
        case '-v':
        case 'version':
            console.log(ANNO_VERSION);
            break;
        case '--help':
        case '-h':
        case 'help':
            usage();
            break;
        default:
            throw new Error(`Unknown command: ${command}. Run anno --help.`);
    }
}
catch (error) {
    console.error(`Anno setup error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
}
//# sourceMappingURL=cli.js.map