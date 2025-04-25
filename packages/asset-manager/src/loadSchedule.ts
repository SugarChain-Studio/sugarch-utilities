import { HookManager } from '@sugarch/bc-mod-hook-manager';
import { resolveMirror, resolveSingle } from './mirrorGroup';
import { Logger } from './logger';
import type { CustomGroupName, FuncWork } from "@sugarch/bc-mod-types";

let isGroupLoaded = false;

const groupLoadWorks: FuncWork[] = [];

/**
 * Push a function to be executed when groups are loaded
 * @param work The function to execute
 */
export function pushGroupLoad (work: FuncWork): void {
    if (isGroupLoaded) work();
    else groupLoadWorks.push(work);
}

function runGroupLoad (): void {
    while (groupLoadWorks.length > 0) groupLoadWorks.shift()!();
}

const assetDefsLoadWorks: Record<string, FuncWork<[AssetGroup]>[]> = {};

/**
 * Push a function to be executed when asset definitions are loaded
 * @param group The group to associate with this work
 * @param work The function to execute
 */
export function pushDefsLoad<Custom extends string = AssetGroupBodyName> (
    group: CustomGroupName<Custom>,
    work: FuncWork<[AssetGroup]>
): void {
    const grp = AssetGroupGet('Female3DCG', group as AssetGroupName);
    if (isGroupLoaded && grp) work(grp);
    else {
        if (!assetDefsLoadWorks[group]) assetDefsLoadWorks[group] = [];
        assetDefsLoadWorks[group]!.push(work);
    }
}

/**
 * Execute all pending work for asset definitions loading
 * @param group The group that has loaded
 */
function runAssetDefsLoad (group: AssetGroup): void {
    if (assetDefsLoadWorks[group.Name]) {
        while (assetDefsLoadWorks[group.Name]!.length > 0) assetDefsLoadWorks[group.Name]!.shift()!(group);
    }
}

const assetLoadWorks: Record<string, FuncWork<[AssetGroup]>[]> = {};

/**
 * Add an item loading event
 * @param group The group to associate with this event
 * @param work The function to execute when the asset is loaded
 */
export function pushAssetLoadEvent<Custom extends string = AssetGroupBodyName> (
    group: CustomGroupName<Custom>,
    work: FuncWork<[AssetGroup]>
): void {
    const grp = AssetGroupGet('Female3DCG', group as AssetGroupName);
    if (isGroupLoaded && grp) work(grp);
    else {
        if (!assetLoadWorks[group]) assetLoadWorks[group] = [];
        assetLoadWorks[group]!.push(work);
    }
}

/**
 * Execute all pending work for asset loading
 * @param group The group that has loaded
 */
function runAssetLoad (group: AssetGroup): void {
    if (assetLoadWorks[group.Name]) {
        while (assetLoadWorks[group.Name]!.length > 0) assetLoadWorks[group.Name]!.shift()!(group);
    }
}

let isAfterLoaded = false;
const afterLoadWorks: (() => void)[] = [];

/**
 * Push a function to be executed after all loading is complete
 * @param work The function to execute
 */
export function pushAfterLoad (work: () => void): void {
    if (isAfterLoaded) work();
    else afterLoadWorks.push(work);
}

const missingGroups = new Set<string>();

/**
 * Require a group to be loaded and execute a callback when loading is complete
 * (may execute multiple times, once for each mirror)
 * @param group The group to require
 * @param noMirror Whether to ignore mirrored groups
 * @param resolve The callback function to execute when the group is loaded
 */
export function requireGroup<Custom extends string = AssetGroupBodyName> (
    group: CustomGroupName<Custom>,
    noMirror: boolean,
    resolve: (group: AssetGroup) => void
): void {
    const wk = (_resolve: typeof resolve) => {
        const mirrors = noMirror ? [resolveSingle(group)] : resolveMirror(group);
        const unresolved = mirrors.find(({ group }) => !group);
        if (unresolved) {
            if (missingGroups.has(unresolved.name)) {
                console.error(`[AssetManager] Required group "${unresolved.name}" not found`);
                return;
            }
            missingGroups.add(unresolved.name);
            pushAssetLoadEvent(unresolved.name, () => wk(_resolve));
            return;
        }
        mirrors.forEach(({ group }) => _resolve(group));
    };

    if (isGroupLoaded) {
        wk(resolve);
    } else {
        pushAssetLoadEvent(group, () => wk(resolve));
    }
}

/**
 * Initialize the body group loading process events, ensuring execution after loading is complete
 */
export function runSetupLoad (
    loadMessage: {
        start: string;
        end: string;
    } = {
        start: 'Start loading',
        end: 'Loading completed, time usage: ',
    }
): void {
    const mLoadGroup = async () => {
        Logger.info(loadMessage.start);

        const time = Date.now();
        // First execute all direct loading events (generally custom group loading)
        runGroupLoad();
        isGroupLoaded = true;
        // Load all AssetDefine and ExtenedConfig
        AssetGroup.forEach(group => runAssetDefsLoad(group));
        // Then execute all complete loading events for groups (generally custom item loading added through requireGroup)
        AssetGroup.forEach(group => runAssetLoad(group));
        // Reload crafting items
        CraftingAssets = CraftingAssetsPopulate();

        isAfterLoaded = true;
        while (afterLoadWorks.length > 0) afterLoadWorks.shift()!();
        const end = Date.now();

        Logger.info(`${loadMessage.end} ${end - time}ms`);
    };

    if (AssetGroup.length > 50) {
        mLoadGroup();
    } else {
        HookManager.progressiveHook('AssetLoadAll', 1)
            .next()
            .inject(() => mLoadGroup());
    }
}
