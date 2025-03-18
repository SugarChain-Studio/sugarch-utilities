import { loadAsset, loadExtendedConfig, modifyAsset, modifyAssetLayers, modifyGroup } from './assetUtils';
import { loadGroup, mirrorGroup } from './groupUtils';
import { pushAfterLoad, runSetupLoad } from './loadSchedule';
import { addCustomDialog, setupCustomDialog } from './dialog';
import { pickEntry, setupEntries } from './entries';
import { enableCustomAssets, getCustomAssets } from './customStash';
import { addLayerNames, addLayerNamesByEntry, setupLayerNameLoad } from './layerNames';
import { enableValidation, FromModUserTestFunc } from './validation';
import type {
    CustomAssetDefinition,
    CustomGroupDefinition,
    CustomGroupedAssetDefinitions,
    CustomGroupName,
    FuncWork,
    Translation,
    ImageMappingRecord,
} from '@sugarch/bc-mod-types';
import { ImageMapping } from '@sugarch/bc-image-mapping';
import { ILogger, setLogger } from './logger';

export type * from '@sugarch/bc-mod-types';

export { resolveAssetOverrides } from '@sugarch/bc-image-mapping';

class _AssetManager<Custom extends string = AssetGroupBodyName> {
    /**
     * Add an asset. If the asset is ItemTorso or ItemTorso2, a mirror will be automatically added.
     * @param group The asset group
     * @param asset The asset definition
     * @param extended Optional extended asset properties
     * @param description Optional asset name translation
     * @param noMirror Whether to not add a mirror
     */
    addAsset (
        group: CustomGroupName<Custom>,
        asset: CustomAssetDefinition<Custom>,
        extended?: AssetArchetypeConfig,
        description?: Translation.Entry,
        noMirror = false
    ) {
        const extendedConfig = extended && { [group]: { [asset.Name]: extended } };
        loadAsset(group, asset, { extendedConfig, description, noMirror });
    }

    /**
     * Add many assets to many groups
     * @param groupedAssets Many assets!
     * @param descriptions Many asset name translations!
     * @param extended Optional extended asset properties
     */
    addGroupedAssets (
        groupedAssets: CustomGroupedAssetDefinitions<Custom>,
        descriptions?: Translation.GroupedEntries,
        extended?: ExtendedItemMainConfig
    ) {
        for (const [group, assets] of Object.entries(groupedAssets)) {
            for (const asset of assets) {
                const groupName = group as CustomGroupName;
                const description = descriptions && pickEntry(groupName, asset.Name, descriptions);
                const extendedConfig = extended &&
                    extended[groupName]?.[asset.Name] && {
                        [groupName]: { [asset.Name]: extended[groupName][asset.Name] },
                    };
                loadAsset(groupName, asset, { extendedConfig, description });
            }
        }
    }

    /**
     * Add grouped configuration
     * @param extendedConfig
     */
    addGroupedConfig (extendedConfig: ExtendedItemMainConfig) {
        loadExtendedConfig(extendedConfig);
    }

    /**
     * Modify asset properties (use with caution)
     * @param group The body group name
     * @param asset The asset name
     * @param work
     */
    modifyAsset (group: CustomGroupName, asset: string, work: FuncWork<[Mutable<AssetGroup>, Mutable<Asset>]>) {
        modifyAsset(group, asset, work);
    }

    /**
     * Modify asset layers (use with caution)
     * @param filter Asset filter
     * @param work
     */
    modifyAssetLayers (filter: (asset: Asset) => boolean, work: FuncWork<[Mutable<Asset>, Mutable<AssetLayer>]>) {
        modifyAssetLayers(filter, work);
    }

    /**
     * Modify body group properties (use with caution)
     * @param group
     * @param work
     */
    modifyGroup (group: CustomGroupName, work: FuncWork<[Mutable<AssetGroup>]>) {
        modifyGroup(group, work);
    }

    /**
     * Add custom dialog. If it contains ItemTorso or ItemTorso2, a mirror will be automatically added.
     * @param dialog
     */
    addCustomDialog (dialog: Translation.Dialog) {
        addCustomDialog(dialog);
    }

    /**
     * Add custom image mappings
     * @param mappings
     */
    addImageMapping (mappings: ImageMappingRecord) {
        ImageMapping.addImgMapping(mappings);
    }

    /**
     * Forwarding ImageMapping interface
     */
    get imageMapping () {
        return ImageMapping;
    }

    /**
     * Add a new body group
     * @param groupDef
     * @param description
     */
    addGroup (groupDef: CustomGroupDefinition<Custom>, description?: Translation.Entry) {
        loadGroup(groupDef, { description });
    }

    /**
     * Add a new body group by copying configuration from an existing group
     * @param newGroup
     * @param copyFrom
     * @param description
     */
    addCopyGroup (newGroup: CustomGroupName<Custom>, copyFrom: AssetGroupName, description?: Translation.Entry) {
        mirrorGroup(newGroup, copyFrom, description);
    }

    /**
     * Add custom layer names. Layer names are obtained from the asset definition.
     * @param group The body group name
     * @param assetDef The asset definition
     * @param entries Layer-name, grouped by language
     */
    addLayerNames (
        group: CustomGroupName<Custom>,
        assetDef: CustomAssetDefinition<Custom>,
        entries: Translation.CustomRecord<string, string>
    ) {
        addLayerNames(group, assetDef, { entries });
    }

    /**
     * Add custom layer names. Layer names are obtained from entries.
     * @param group The body group name
     * @param assetName The asset name
     * @param entries Layer-name, grouped by language
     */
    addLayerNamesByEntry (
        group: CustomGroupName<Custom>,
        assetName: string,
        entries: Translation.CustomRecord<string, string>
    ) {
        addLayerNamesByEntry(group, assetName, entries);
    }

    /**
     * Check if an asset is custom
     * @param asset The asset
     * @returns True if the asset is custom
     */
    assetIsCustomed (asset: Asset): boolean {
        return getCustomAssets()[asset.Group.Name]?.[asset.Name] !== undefined;
    }

    /**
     * Add an event after loading is complete
     * @param wk
     */
    afterLoad (wk: () => void) {
        pushAfterLoad(wk);
    }

    /**
     * Initialize and add custom component.
     *
     * *Note: This function should be called **only once**.*
     * @param componentSetup Component setup function, all custom components should be initialized inside this function
     */
    init (componentSetup: FuncWork) {
        // Initialize all functions, order doesn't matter much
        setupCustomDialog();
        setupEntries();
        setupLayerNameLoad();

        enableCustomAssets();

        componentSetup();
        runSetupLoad();
    }

    /**
     * Enable non-mod removal validation
     * @param fromModUserTest Function to determine if the user is from a mod
     */
    enableValidation (fromModUserTest: FromModUserTestFunc) {
        enableValidation(fromModUserTest);
    }

    /**
     * Set the logger for the asset manager
     * @param logger
     */
    setLogger (logger: ILogger) {
        setLogger(logger);
    }

    /**
     * Retype AssetManager, if you need to customize the body group name and ensure
     * type safety, use this method to get a re-typed version
     * @returns retyped AssetManager
     */
    typeBodyGroupNames<T extends string> () {
        return this as _AssetManager<T>;
    }
}

export type AssetManagerType<Custom extends string> = _AssetManager<Custom>;

export const AssetManager = new _AssetManager();
