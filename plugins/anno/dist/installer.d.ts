export declare const ANNO_VERSION = "0.4.0";
export declare const ANNO_PACKAGE = "@philmingdao/anno@0.4.0";
export type InstallHost = 'codex' | 'claude' | 'workbuddy' | 'codebuddy' | 'cursor' | 'antigravity' | 'windsurf' | 'copilot' | 'muse';
export type InstallScope = 'user' | 'project';
export interface InstallOptions {
    hosts: InstallHost[];
    scope: InstallScope;
    home?: string;
    projectDir?: string;
    customConfig?: string;
    dryRun?: boolean;
    force?: boolean;
    skipDoctor?: boolean;
}
export interface InstallChange {
    host: InstallHost;
    action: 'created' | 'updated' | 'unchanged' | 'removed' | 'command' | 'verified';
    target: string;
    backup?: string;
}
export declare function setup(options: InstallOptions): Promise<InstallChange[]>;
export declare function uninstall(options: InstallOptions): Promise<InstallChange[]>;
export declare function doctor(options: InstallOptions): Promise<InstallChange[]>;
export declare function detectedHosts(home?: string): InstallHost[];
