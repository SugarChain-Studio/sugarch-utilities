import { HookManager } from '@sugarch/bc-mod-hook-manager';
import type { CustomGroupName } from '@sugarch/bc-mod-types';
import { SyncPromise } from './syncPromise';

const customGroups: Record<string, AssetGroup> = {};

const customAssets: Record<string, Record<string, Asset>> = {};

const customGroupDefs: Record<string, AssetGroupDefinition> = {};

const strictCustomAssets: { name: string; asset: Asset }[] = [];

export const AccessCustomAsset = <Custom extends string = AssetGroupBodyName>(
    group: CustomGroupName<Custom>,
    name: string
): Asset | undefined => customAssets[group]?.[name];

/**
 * Add a custom asset group
 */
export function customGroupAdd(
    ...[family, groupDef]: Parameters<typeof AssetGroupAdd>
): SyncPromise<Mutable<AssetGroup>> {
    // Prevent the addition process from being disrupted
    const Group = HookManager.invokeOriginal('AssetGroupAdd', family, groupDef);
    customGroups[Group.Name] = Group;
    customGroupDefs[Group.Name] = groupDef;
    return SyncPromise.resolve(Group as Mutable<AssetGroup>);
}

/**
 * Mark a custom asset that is not created by mirroring groups
 */
export function customAssetMarkStrict(name: string, asset: Asset) {
    strictCustomAssets.push({ name, asset });
}

export function customAssetGetStrict(name: string): Asset | undefined {
    return strictCustomAssets.find((x) => x.name === name)?.asset;
}

/**
 * Add a custom asset
 */
export function customAssetAdd(...[group, assetDef, config, groupDef]: Parameters<typeof AssetAdd>): SyncPromise<Mutable<Asset>> {
    // Prevent the addition process from being disrupted
    // NOTE: 2026-05-11, R128-Alpha an addtional parameter `groupDef` is added, it should work with older version of `AssetAdd` since the 
    // additional parameter should be ignored by the original function.
    // Tested with R127, and it works as expected.
    HookManager.invokeOriginal('AssetAdd', group, assetDef, config, groupDef);
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
 * Get all custom group definitions
 */
export function getCustomGroupDefs<Custom extends string = AssetGroupBodyName>(): Record<
    CustomGroupName<Custom>,
    AssetGroupDefinition
> {
    return customGroupDefs as Record<CustomGroupName<Custom>, AssetGroupDefinition>;
}

/**
 * Get all custom groups
 */
export function getCustomGroups<Custom extends string = AssetGroupBodyName>(): Record<
    CustomGroupName<Custom>,
    AssetGroup
> {
    return customGroups as Record<CustomGroupName<Custom>, AssetGroup>;
}

/**
 * Get all custom assets
 */
export function getCustomAssets<Custom extends string = AssetGroupBodyName>(): Record<
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
export function isInListCustomAsset(group: CustomGroupName, name: string): boolean {
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

export let useValidator: UseValidator | undefined = undefined;

/**
 * Check if an item is custom
 * @param {Item | null} item
 */
export function checkItemCustomed(item: { Asset?: Asset } | null): boolean {
    return !!(item && item.Asset && AccessCustomAsset(item.Asset.Group.Name, item.Asset.Name));
}

/**
 * Set the asset use validator, if it calculates false, the custom asset will not be shown on the inventory and cannot be used on the target user
 * @param validator The validator function to determine if the custom asset should be shown to the target user
 */
export function setCustomAssetUseValidator(validator: UseValidator) {
    useValidator = validator;
}
