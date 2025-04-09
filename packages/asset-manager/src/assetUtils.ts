import { AssetConfig, ParsedAsset, resolveStringAsset } from './assetConfigs';
import { customAssetAdd, customAssetMarkStrict, getCustomAssets } from './customStash';
import { Entries, resolveEntry, solidfyEntry } from './entries';
import { addLayerNames } from './layerNames';
import { pushAfterLoad, pushAssetLoadEvent, pushDefsLoad, requireGroup } from './loadSchedule';
import type { CustomAssetDefinition, CustomGroupName, FuncWork, Translation } from '@sugarch/bc-mod-types';

/**
 * Mirror a global function between asset groups
 * @param group
 * @param preimageGroup
 * @param asset
 * @param category
 */
function globalFunctionMirror<Custom extends string = AssetGroupBodyName> (
    group: CustomGroupName<Custom>,
    preimageGroup: CustomGroupName<Custom>,
    asset: { Name: string },
    category: string
) {
    const preimageFunction = `Assets${preimageGroup}${asset.Name}${category}`;
    const newFunction = `Assets${group}${asset.Name}${category}`;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    if ((globalThis as any)[preimageFunction]) {
        (globalThis as any)[newFunction] = (globalThis as any)[preimageFunction];
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
}

/**
 * Add an item
 * @param groupName Body group name
 * @param asset Item definition
 * @param config Additional configuration
 * @param config.extendedConfig Extended configuration
 * @param config.description Display name
 * @param config.dynamicName Dynamic group name
 * @param config.preimage Preimage group (for mirroring)
 * @param config.noMirror Whether to not add a mirror
 */
export function loadAsset<Custom extends string = AssetGroupBodyName> (
    groupName: CustomGroupName<Custom>,
    asset: CustomAssetDefinition<Custom>,
    {
        extendedConfig,
        description,
        dynamicName,
        preimage,
        noMirror,
    }: {
        extendedConfig?: ExtendedItemMainConfig;
        description?: Translation.Entry;
        dynamicName?: CustomGroupName<Custom>;
        preimage?: AssetGroup;
        noMirror?: boolean;
    } = {}
) {
    pushDefsLoad(groupName, groupObj => {
        // Won't be called repeatedly due to mirrored groups
        ParsedAsset.add(groupObj.Name as CustomGroupName<Custom>, asset);
        if (extendedConfig) AssetConfig.add(extendedConfig);
    });

    const srcGroupName = groupName;

    requireGroup(groupName, !!noMirror, groupObj => {
        // Note that this function is called once for each mirrored body group, so we can't use the outer groupName
        // Using const shadowing to avoid this problem
        const groupName = groupObj.Name;
        const assetDef = resolveStringAsset(asset as AssetDefinition);

        const assetDefRes = AssetResolveCopyConfig.AssetDefinition(assetDef, groupName, ParsedAsset.value);
        if (!assetDefRes) return;

        const solidDesc = solidfyEntry(description, assetDefRes.Name.replace(/_.*?Luzi$/, ''));

        if (getCustomAssets()[groupName]?.[assetDef.Name] !== undefined) {
            console.warn(`[AssetManager] Asset {${groupName}:${assetDef.Name}} already existed!`);
        }

        // First set the display name here
        customAssetAdd(groupObj, assetDefRes, AssetConfig.value).then(asset => {
            if (asset.DynamicGroupName === asset.Group.Name) {
                if (dynamicName) asset.DynamicGroupName = dynamicName as AssetGroupName;
                else asset.DynamicGroupName = srcGroupName as AssetGroupName;
            }

            if (preimage) {
                const preimageAsset = AssetGet('Female3DCG', preimage.Name, assetDefRes.Name);
                if (preimageAsset) {
                    asset.Description = preimageAsset.Description;
                    asset.DynamicGroupName = preimageAsset.DynamicGroupName;

                    (['ScriptDraw', 'BeforeDraw', 'AfterDraw'] as const)
                        .filter(prop => preimageAsset[`Dynamic${prop}`])
                        .forEach(prop => globalFunctionMirror(groupName, preimage.Name, assetDefRes, prop));
                }
            } else {
                asset.Description = resolveEntry(solidDesc);
                customAssetMarkStrict(assetDefRes.Name, asset);
                addLayerNames(asset.DynamicGroupName, assetDefRes as CustomAssetDefinition, {
                    noOverride: true,
                });
            }
        });
        // Register the name in entry management, if the game gets the name through asynchronous loading, correct it in entry management
        Entries.setAsset(groupName, assetDefRes.Name, solidDesc);
    });
}

/**
 * Load extended configuration
 * @param extendedConfig
 */
export function loadExtendedConfig (extendedConfig?: ExtendedItemMainConfig) {
    if (extendedConfig) {
        AssetConfig.add(extendedConfig);
    }
}

/** Track missing assets to prevent repeated errors */
const missingAsset: Record<string, Set<string>> = {};

/**
 * Modify an item
 * @param groupName Body group name
 * @param assetName Item name
 * @param work
 */
export function modifyAsset<Custom extends string = AssetGroupBodyName> (
    groupNames: CustomGroupName<Custom> | CustomGroupName<Custom>[],
    assetName: string,
    work: FuncWork<[Mutable<AssetGroup>, Mutable<Asset>]>
) {
    if (typeof groupNames === 'string') groupNames = [groupNames];
    for(const groupName of groupNames) {
        const wk = (groupObj: AssetGroup) => {
            const asset = AssetGet('Female3DCG', groupObj.Name, assetName);
            if (!asset) {
                if (!missingAsset[groupName]) missingAsset[groupName] = new Set();
                if (missingAsset[groupName]!.has(assetName)) {
                    console.error(`[AssetManager] Asset ${groupName}:${assetName} not found`);
                    return;
                } else {
                    missingAsset[groupName]!.add(assetName);
                    pushAssetLoadEvent(groupName, wk);
                }
            } else work(groupObj as Mutable<AssetGroup>, asset as Mutable<Asset>);
        };

        pushAssetLoadEvent(groupName, wk);
    }
}

/**
 * Adjust item properties
 * @param filter Item filter
 * @param work
 */
export function modifyAssetLayers (
    filter: (asset: Asset) => boolean,
    work: FuncWork<[Mutable<Asset>, Mutable<AssetLayer>]>
) {
    pushAfterLoad(() => {
        // Assuming Asset is a global array of assets
        Asset.filter(filter).forEach((asset: Asset) => {
            asset.Layer.forEach(layer => work(asset as Mutable<Asset>, layer as Mutable<AssetLayer>));
        });
    });
}

/**
 * Modify an item group
 * @param groupName Body group name
 * @param work
 */
export function modifyGroup<Custom extends string = AssetGroupBodyName> (
    groupName: CustomGroupName<Custom>,
    work: FuncWork<[Mutable<AssetGroup>]>
) {
    pushAssetLoadEvent(groupName, groupObj => work(groupObj as Mutable<AssetGroup>));
}
