import { HookManager, HookManagerInterface } from '@sugarch/bc-mod-hook-manager';
import type { CustomGroupName } from '@sugarch/bc-mod-types';
import { oncePatch } from './oncePatch';

const customGroups: Record<string, AssetGroup> = {};

const customAssets: Record<string, Record<string, Asset>> = {};

const strictCustomAssets: {name: string, asset:Asset} [] = [];

export const AccessCustomAsset = <Custom extends string = AssetGroupBodyName>(
    group: CustomGroupName<Custom>,
    name: string
): Asset | undefined => customAssets[group]?.[name];

/**
 * Add a custom asset group
 */
export function customGroupAdd (...[family, groupDef]: Parameters<typeof AssetGroupAdd>): Promise<Mutable<AssetGroup>> {
    // Prevent the addition process from being disrupted
    const Group = HookManager.invokeOriginal('AssetGroupAdd', family, groupDef);
    customGroups[Group.Name] = Group;
    return Promise.resolve(Group as Mutable<AssetGroup>);
}

/** 
 * Mark a custom asset that is not created by mirroring groups
 */
export function customAssetMarkStrict (name: string, asset: Asset) {
    strictCustomAssets.push({ name, asset });
}

export function customAssetGetStrict (name: string): Asset | undefined {
    return strictCustomAssets.find(x => x.name === name)?.asset;
}

/**
 * Add a custom asset
 */
export function customAssetAdd (...[group, assetDef, config]: Parameters<typeof AssetAdd>): Promise<Mutable<Asset>> {
    // Prevent the addition process from being disrupted
    HookManager.invokeOriginal('AssetAdd', group, assetDef, config);
    const groupName = group.Name;
    const assetName = assetDef.Name;
    if (!customAssets[groupName]) customAssets[groupName] = {};
    const as = AssetGet('Female3DCG', groupName, assetName);
    if (as) {
        customAssets[groupName][assetName] = as;
        return Promise.resolve(as as Mutable<Asset>);
    }

    // NOTE: This situation should not be possible
    return Promise.reject(`Asset ${groupName}:${assetName} not found`);
}

/**
 * Get all custom groups
 */
export function getCustomGroups<Custom extends string = AssetGroupBodyName> (): Record<
    CustomGroupName<Custom>,
    AssetGroup
> {
    return customGroups as Record<CustomGroupName<Custom>, AssetGroup>;
}

/**
 * Get all custom assets
 */
export function getCustomAssets<Custom extends string = AssetGroupBodyName> (): Record<
    CustomGroupName<Custom>,
    Record<string, Asset>
> {
    return customAssets as Record<CustomGroupName<Custom>, Record<string, Asset>>;
}

/**
 * Check if a custom asset is in the list and visible
 * @param {CustomGroupName} group
 * @param {string} name
 * @returns {boolean}
 */
export function isInListCustomAsset (group: CustomGroupName, name: string): boolean {
    /** @type {Asset | undefined} */
    const asset = AccessCustomAsset(group, name);
    return !!asset && !asset.NotVisibleOnScreen?.includes('LuziScreen');
}

/**
 * Enable custom assets in the game
 */
export function enableCustomAssets (): void {
    let doInventoryAdd = false;
    HookManager.progressiveHook('DialogInventoryBuild').inject(args => {
        if (args[2]) return;
        doInventoryAdd = true;
    });

    HookManager.progressiveHook('DialogInventoryAdd')
        .next()
        .inject(args => {
            if (!doInventoryAdd) return;
            doInventoryAdd = false;
            const groupName = args[1].Asset.Group.Name;
            const added = new Set(DialogInventory.map(item => item.Asset.Name));

            if (customAssets[groupName]) {
                Object.entries(customAssets[groupName])
                    .filter(
                        ([assetName, asset]) =>
                            !asset.NotVisibleOnScreen?.includes('LuziScreen') && !added.has(assetName)
                    )
                    .forEach(([_, asset]) => DialogInventoryAdd(args[0], { Asset: asset }, false));
            }
        });

    const overrideAvailable = (
        ...[args, next]: Parameters<HookManagerInterface.HookFunction<'InventoryAvailable'>>
    ) => {
        const [_, Name, Group] = args;
        if (AccessCustomAsset(Group, Name)) return true;
        return next(args);
    };

    HookManager.progressiveHook('InventoryAvailable').inside('CharacterAppearanceValidate').override(overrideAvailable);
    HookManager.progressiveHook('InventoryAvailable').inside('CraftingItemListBuild').override(overrideAvailable);
    HookManager.progressiveHook('InventoryAvailable').inside('WardrobeFastLoad').override(overrideAvailable);

    HookManager.progressiveHook('CraftingValidate').inject(args => {
        const item = args[0]?.Item;
        if (!item) return;
        const asset = CraftingAssets[item]?.[0];
        if (asset && isInListCustomAsset(asset.Group.Name, asset.Name)) args[3] = false;
    });

    if(GameVersion === "R114") {
        type CraftingInventoryStash = { providers: (() => Item[])[] };
        oncePatch<CraftingInventoryStash>().getMayOverride('CraftingInventory', old => {
            const flatCustomAssets = (custom: typeof customAssets) =>
                Object.values(custom)
                    .map(x => Object.values(x))
                    .flat()
                    .map(Asset => ({ Asset })) as Item[];
    
            if (old) {
                const stash = old as CraftingInventoryStash;
                stash.providers.push(() => flatCustomAssets(customAssets));
                return stash;
            } else {
                const ret: CraftingInventoryStash = { providers: [] };
                ret.providers.push(() => flatCustomAssets(customAssets));
                const pInventory = HookManager.randomGlobalFunction('CraftingInventory', () => {
                    return [...Player.Inventory, ...ret.providers.map(x => x()).flat()];
                });
                HookManager.patchFunction('CraftingRun', {
                    'for (let Item of Player.Inventory) {': `for (let Item of ${pInventory}()) {`,
                });
                return ret;
            }
        });
    }
}

/**
 * Check if an item is custom
 * @param {Item | null} item
 */
export function checkItemCustomed (item: { Asset?: Asset } | null): boolean {
    return !!(item && item.Asset && AccessCustomAsset(item.Asset.Group.Name, item.Asset.Name));
}
