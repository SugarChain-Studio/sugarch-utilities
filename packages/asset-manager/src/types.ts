import { Translation } from '@sugarch/bc-mod-types';

export interface BasicAddAssetConfig {
    /** Asset name translation (non optional) */
    description: Translation.Entry;
    /** Asset layer and color groups translation */
    layerNames: Translation.Dialog;
    /** Whether to not add this asset to mirrored groups */
    noMirror?: boolean;
}

export type ExtendedAddAssetConfig = BasicAddAssetConfig & {
    /** Extended asset properties */
    extended: AssetArchetypeConfig;
    /** Asset custom dialogs translation */
    assetDialogs: Translation.Dialog;
};

export type AddAssetConfig = BasicAddAssetConfig | ExtendedAddAssetConfig;

export function isAddAssetConfig(value: AddAssetConfig | AssetArchetypeConfig | undefined): value is AddAssetConfig {
    return !!value && typeof value === "object" && "description" in value;
}

export function isBasicAddAssetConfig(value: AddAssetConfig): value is BasicAddAssetConfig {
    return value && typeof value === "object" && (!("extended" in value) || !("assetDialogs" in value));
}
