import { Translation } from '@sugarch/bc-mod-types';

export type AddAssetConfig = {
    /** Asset name translation (non optional) */
    translation: Translation.Entry;
    /** Asset layer and color groups translation */
    layerNames: Translation.String;
    /** Whether to not add this asset to mirrored groups */
    noMirror?: boolean;

    /** Extended asset properties */
    extended?: AssetArchetypeConfig;

    /** 
     * @deprecated Use `assetStrings` instead
     * 
     * Asset custom dialogs translation 
     */
    assetDialogs?: Translation.Dialog;
    /** Asset custom asset string translation */
    assetStrings?: Translation.String;
}