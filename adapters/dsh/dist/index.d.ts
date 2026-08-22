export declare const ANNO_DSH_VERSION = "0.1.0";
export declare const ANNO_DSH_PACKAGE = "@philmingdao/anno-dsh@0.1.0";
export declare const ANNO_VERSION = "0.4.0";
export declare const ANNO_PACKAGE = "@philmingdao/anno@0.4.0";
export declare const DSH_VERSION = "0.1.0-rc.6";
export interface DshOptions {
    profile?: string;
    dshHome?: string;
    packageSpec?: string;
    dryRun?: boolean;
    force?: boolean;
    skipDoctor?: boolean;
}
export interface DshChange {
    action: 'created' | 'updated' | 'unchanged' | 'removed' | 'command' | 'verified' | 'preserved';
    target: string;
    backup?: string;
}
export declare function install(options?: DshOptions): Promise<DshChange[]>;
export declare function update(options?: DshOptions): Promise<DshChange[]>;
export declare function uninstall(options?: DshOptions): Promise<DshChange[]>;
export declare function doctor(options?: DshOptions): Promise<DshChange[]>;
