import { resolveMirror } from './mirrorGroup';
import { CustomAssetDefinition, CustomGroupName } from './types';

export class AssetConfig {
    /**
     * @param extendedConfig
     */
    static add (extendedConfig: ExtendedItemMainConfig) {
        for (const [groupName, assets] of Object.entries(extendedConfig)) {
            for (const [assetName, config] of Object.entries(assets)) {
                resolveMirror(groupName as CustomGroupName).forEach(({ name }) => {
                    if (!AssetFemale3DCGExtended[name]) AssetFemale3DCGExtended[name] = {};
                    if (!AssetFemale3DCGExtended[name][assetName]) AssetFemale3DCGExtended[name][assetName] = config;
                });
            }
        }
    }

    static get value () {
        return AssetFemale3DCGExtended;
    }
}

/**
 * Maintain an array of all item definitions (not the items themselves)
 */
const parsedAsset: Record<string, Record<string, AssetDefinition>> = {};

export class ParsedAsset {
    /**
     * @param groupName
     * @param assetDef
     */
    static add<Custom extends string = AssetGroupBodyName> (
        groupName: CustomGroupName<Custom>,
        assetDef: CustomAssetDefinition<Custom>
    ): Partial<Record<AssetGroupName, Record<string, AssetDefinition>>> {
        if (Object.keys(parsedAsset).length === 0) {
            // Get all item definitions from AssetFemale3DCG
            AssetFemale3DCG.forEach(group => {
                if (!parsedAsset[group.Group]) parsedAsset[group.Group] = {};
                for (const asset of group.Asset) {
                    const rAsset = resolveStringAsset(asset);
                    parsedAsset[group.Group][rAsset.Name] = rAsset;
                }
            });
        }
        if (!parsedAsset[groupName]) parsedAsset[groupName] = {};
        parsedAsset[groupName][assetDef.Name] = assetDef as AssetDefinition;
        return parsedAsset;
    }

    static get value () {
        return parsedAsset;
    }
}

/**
 * Convert string-style item definitions to regular item definitions
 * @param asset
 */
export function resolveStringAsset (asset: string | AssetDefinition): AssetDefinition {
    return typeof asset === 'string' ? { Name: asset } : asset;
}
