import { HookManager, HookManagerInterface } from '@sugarch/bc-mod-hook-manager';
import type { CustomGroupName } from '@sugarch/bc-mod-types';
import { SyncPromise } from './syncPromise';
import { queryMirrorPreimage } from './mirrorGroup';

const customGroups: Record<string, AssetGroup> = {};

const customAssets: Record<string, Record<string, Asset>> = {};

const strictCustomAssets: { name: string; asset: Asset }[] = [];

export const AccessCustomAsset = <Custom extends string = AssetGroupBodyName>(
    group: CustomGroupName<Custom>,
    name: string
): Asset | undefined => customAssets[group]?.[name];

/**
 * Add a custom asset group
 */
export function customGroupAdd (
    ...[family, groupDef]: Parameters<typeof AssetGroupAdd>
): SyncPromise<Mutable<AssetGroup>> {
    // Prevent the addition process from being disrupted
    const Group = HookManager.invokeOriginal('AssetGroupAdd', family, groupDef);
    customGroups[Group.Name] = Group;
    return SyncPromise.resolve(Group as Mutable<AssetGroup>);
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
export function customAssetAdd (...[group, assetDef, config]: Parameters<typeof AssetAdd>): SyncPromise<Mutable<Asset>> {
    // Prevent the addition process from being disrupted
    HookManager.invokeOriginal('AssetAdd', group, assetDef, config);
    const groupName = group.Name;
    const assetName = assetDef.Name;
    if (!customAssets[groupName]) customAssets[groupName] = {};
    const as = AssetGet('Female3DCG', groupName, assetName);
    if (as) {
        customAssets[groupName][assetName] = as;
        return SyncPromise.resolve(as as Mutable<Asset>);
    }

    // NOTE: This situation should not be possible
    return SyncPromise.reject(`Asset ${groupName}:${assetName} not found`);
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
    return !!asset && asset.Value >= 0;
}

/**
 * Set if target user should not show the custom asset
 * @param target The target user to whom the item is used on
 * @returns {boolean} Whether the custom assets should be shown
 */
export type UseValidator = (target: Character) => boolean;

let useValidator: UseValidator | undefined = undefined;

/**
 * Enable custom assets in the game
 */
export function enableCustomAssets (): void {
    let doInventoryAdd = false;

    HookManager.hookFunction('DialogInventoryBuild', 0, (args, next) => {
        if (!args[2]) {
            doInventoryAdd = DialogMenuMode !== 'permissions';
        }
        const ret = next(args);
        if ((DialogMenuMode === "items" || DialogMenuMode === null) && useValidator && !args[0].IsPlayer() && !useValidator(args[0]))  {
            DialogInventory = DialogInventory.filter(item => !checkItemCustomed(item));
        }
        return ret;
    });

    const preAvailable: typeof globalThis['InventoryAvailable'] = (C, N, G) => {
        const pre = queryMirrorPreimage(G);
        return pre ? HookManager.invokeOriginal('InventoryAvailable', C, N, pre) : false;
    };

    HookManager.hookFunction('DialogInventoryAdd', 10, (args, next) => {
        const ret = next(args);
        if (!doInventoryAdd) return ret;
        doInventoryAdd = false;

        const groupName = args[1].Asset.Group.Name;
        const added = new Set(DialogInventory.map(item => item.Asset.Name));
        const content = customAssets[groupName];
        if (!content) return ret;

        Object.entries(content)
            .filter(([assetName]) => !added.has(assetName))
            .filter(([assetName, asset]) => asset.Value >= 0 || preAvailable(args[0], assetName, groupName))
            .forEach(([_, asset]) => DialogInventoryAdd(args[0], { Asset: asset }, false));
            
        return ret;
    });

    const insides = [
        HookManager.insideFlag('CharacterAppearanceValidate'),
        HookManager.insideFlag('CraftingItemListBuild'),
        HookManager.insideFlag('WardrobeFastLoad'),
        HookManager.insideFlag('CraftingValidate'),
    ];

    const overrideAvailable = (
        ...[args, next]: Parameters<HookManagerInterface.HookFunction<'InventoryAvailable'>>
    ) => {
        if (!insides.some(flag => flag.inside)) return next(args);
        if (isInListCustomAsset(args[2], args[1]) || preAvailable(...args)) return true;
        return next(args);
    };

    HookManager.hookFunction('InventoryAvailable', 0, overrideAvailable);
}

/**
 * Check if an item is custom
 * @param {Item | null} item
 */
export function checkItemCustomed (item: { Asset?: Asset } | null): boolean {
    return !!(item && item.Asset && AccessCustomAsset(item.Asset.Group.Name, item.Asset.Name));
}


/**
 * Set the asset use validator, if it calculates false, the custom asset will not be shown on the inventory and cannot be used by the target user
 * @param validator The validator function to determine if the custom asset should be shown to the target user
 */
export function setCustomAssetUseValidator (validator: UseValidator) {
    useValidator = validator;
}