import { loadAsset, loadExtendedConfig, modifyAsset, modifyAssetLayers, modifyGroup } from './assetUtils';
import { loadGroup, mirrorGroup } from './groupUtils';
import { pushAfterLoad, runSetupLoad } from './loadSchedule';
import { addCustomAssetString, setupCustomAssetString } from './dialog';
import { pickEntry, pickStrings, setupEntries } from './entries';
import { customAssetGetStrict, enableCustomAssets, getCustomAssets } from './customStash';
import { addColorGroupNamesRaw, addLayerNames, addLayerNamesRaw, setupLayerNameLoad } from './layerNames';
import { enableValidation, FromModUserTestFunc } from './validation';
import type {
    CustomAssetDefinition,
    CustomGroupDefinition,
    CustomGroupedAssetDefinitions,
    CustomGroupName,
    FuncWork,
    Translation,
    ImageMappingRecord,
    ILogger,
} from '@sugarch/bc-mod-types';
import { ImageMapping } from '@sugarch/bc-image-mapping';
import { setLogger } from './logger';
import { AddAssetConfig } from './types';

export type {
    CustomAssetDefinition,
    CustomGroupDefinition,
    CustomGroupedAssetDefinitions,
    CustomGroupName,
    FuncWork,
    Translation,
    ImageMappingRecord,
    ILogger,
};

export type { CustomAssetDefinitionItem, CustomAssetDefinitionAppearance } from '@sugarch/bc-mod-types';

export { resolveAssetOverrides } from '@sugarch/bc-image-mapping';

class _AssetManager<Custom extends string = AssetGroupBodyName> {
    /**
     * Add an asset. If the asset is ItemTorso or ItemTorso2, a mirror will be automatically added.
     * @param group The asset group
     * @param asset The asset definition
     */
    addAsset(group: CustomGroupName<Custom>, asset: CustomAssetDefinition<Custom>): void;

    /**
     * Add an asset with basic setup.
     * @param group The asset group
     * @param asset The asset definition
     * @param extended Optional extended asset properties
     * @param translation Optional asset name translation
     * @param noMirror Whether to not add a mirror
     */
    addAsset(
        group: CustomGroupName<Custom>,
        asset: CustomAssetDefinition<Custom>,
        extended?: AssetArchetypeConfig,
        translation?: Translation.Entry,
        noMirror?: boolean
    ): void;

    addAsset (
        group: CustomGroupName<Custom>,
        asset: CustomAssetDefinition<Custom>,
        extended?: AssetArchetypeConfig,
        translation?: Translation.Entry,
        noMirror = false
    ) {
        if (!extended) {
            loadAsset(group, asset, { translation, noMirror });
        } else {
            const extendedConfig = { [group]: { [asset.Name]: extended } };
            loadAsset(group, asset, { extendedConfig, translation, noMirror });
        }
    }

    /**
     * Add an asset with detailed configuration.
     *
     * ---
     * You should provide `translation` and `layerNames` for the asset, for example:
     *   ```ts
     *   addAsset(group, assetDef, {
     *     translation: { EN: 'Asset Name' },
     *     layerNames: { EN: { 'Layer1': 'Layer1 Name' } },
     *   })
     *   ```
     * Note that typical layer name and color group name key is like `"ItemTorsoMyAssetLayer1"`, in the config above, you should use `"Layer1"` as the key,
     * the prefix group name `"ItemTorso"` and asset name `"MyAsset"` will be automatically added.
     *
     * ---
     * If the asset is ItemTorso or ItemTorso2, a mirror will be automatically added. This behaviour can be turned off by
     * ```ts
     * addAsset(group, assetDef, { noMirror : true })
     * ```
     *
     * ---
     * If you want to add ExtendedConfig to the asset, you can do it like this:
     * ```ts
     * addAsset(group, assetDef, {
     *   extended: { Archetype: ExtendedArchetype.MODULAR, , ... }, // Extended asset properties
     *   customStrings: { EN : { "SelectBase" : "...", "ModuleM1": "...", ...  } }, // Asset custom asset string translation
     * })
     * ```
     *   Note that typical asset dialog key is like `"ItemTorsoMyAssetOptiona1"`, in the config above, you should use `"Optiona1"` as the key,
     *   the prefix group name `"ItemTorso"` and asset name `"MyAsset"` will be automatically added.
     *
     *
     * @param group The asset group
     * @param asset The asset definition
     * @param config The asset configuration
     */
    addAssetWithConfig (
        group: CustomGroupName<Custom>,
        asset: CustomAssetDefinition<Custom>,
        config: AddAssetConfig
    ): void {
        const rConfig: Parameters<typeof loadAsset>[2] = {
            translation: config.translation,
            noMirror: config.noMirror,
            layerNames: config.layerNames,
            ...(config.extended ? { extendedConfig: { [group]: { [asset.Name]: config.extended } } } : {}),
            assetStrings: config.assetStrings,
        };
        loadAsset(group, asset, rConfig);
    }

    /**
     * Add many assets to many groups
     * @param groupedAssets Assets to be added, organized by group
     * @param translations Asset name translations, organized by group
     * @param groupedLayerNames Layer names, organized by group
     */
    addGroupedAssetsWithConfig (
        groupedAssets: CustomGroupedAssetDefinitions<Custom>,
        translations: Translation.GroupedEntries,
        groupedLayerNames: Translation.GroupedAssetStrings<Custom>,
    ) {
        for (const [group, assets] of Object.entries(groupedAssets)) {
            for (const asset of assets) {
                const groupName = group as CustomGroupName<Custom>;
                const translation = pickEntry(groupName, asset.Name, translations);
                const layerNames = pickStrings(groupName, asset.Name, groupedLayerNames);
                loadAsset(groupName, asset, { translation, layerNames });
            }
        }
    }

    /**
     * Add many assets to many groups
     * @param groupedAssets Many assets!
     * @param translations Many asset name translations!
     * @param extended Optional extended asset properties
     */
    addGroupedAssets (
        groupedAssets: CustomGroupedAssetDefinitions<Custom>,
        translations?: Translation.GroupedEntries,
        extended?: ExtendedItemMainConfig
    ) {
        for (const [group, assets] of Object.entries(groupedAssets)) {
            for (const asset of assets) {
                const groupName = group as CustomGroupName;
                const translation = translations && pickEntry(groupName, asset.Name, translations);
                const extendedConfig = extended &&
                    extended[groupName]?.[asset.Name] && {
                        [groupName]: { [asset.Name]: extended[groupName][asset.Name] },
                    };
                loadAsset(groupName, asset, { extendedConfig, translation });
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
    modifyAsset (
        group: CustomGroupName | CustomGroupName[],
        asset: string,
        work: FuncWork<[Mutable<AssetGroup>, Mutable<Asset>]>
    ) {
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
    modifyGroup (group: CustomGroupName<Custom>, work: FuncWork<[Mutable<AssetGroup>]>) {
        modifyGroup(group, work);
    }

    /**
     * Add custom asset strings. If it contains ItemTorso or ItemTorso2, a mirror will be automatically added.
     * @param dialog
     */
    addCustomAssetString (assetStrings: Translation.String) {
        addCustomAssetString(assetStrings);
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
     * @param translation
     */
    addGroup (groupDef: CustomGroupDefinition<Custom>, translation?: Translation.Entry) {
        loadGroup(groupDef, { translation });
    }

    /**
     * Add a new body group by copying configuration from an existing group
     * @param newGroup New group name
     * @param copyFrom Existing group name
     * @param translation New group display translation
     * @param defOverrides Overrides some properties of the new group
     */
    addCopyGroup (newGroup: CustomGroupName<Custom>, copyFrom: CustomGroupName<Custom>, translation?: Translation.Entry, defOverrides?: Partial<CustomGroupDefinition<Custom>>) {
        mirrorGroup(newGroup, copyFrom, translation, defOverrides);
    }

    /**
     * Add custom layer names (for coloring menu).   
     * Layer names are obtained from the asset definition.  
     * Color group names are also obtained from the asset definition, while their translation is obtained from the entry, 
     * just like layer names. (Thus not support color group with a same name with layer shows as different name with the layer)
     * @param group The body group name
     * @param assetDef The asset definition
     * @param entries Layer-name, grouped by language
     */
    addLayerNames (
        group: CustomGroupName<Custom>,
        assetDef: CustomAssetDefinition<Custom>,
        entries: Translation.String
    ) {
        addLayerNames(group, assetDef, { entries });
    }

    /**
     * Add custom layer names (for coloring menu). Layer names are obtained from the entry.
     * This function does not add color groups name.
     * @param group The body group name
     * @param assetName The asset name
     * @param entry Layer-Name record, grouped by language
     */
    addLayerNamesRaw (group: CustomGroupName<Custom>, assetName: string, entry: Translation.CustomRecord<string, string>) {
        addLayerNamesRaw(group, assetName, entry);
    }

    /**
     * Add custom color group names (for coloring menu). Color group names are obtained from the entry.
     * This function does not add layer names.
     * @param group The body group name
     * @param assetName The asset name
     * @param entry ColorGroupName-Name record, grouped by language
     */
    addColorGroupNamesRaw (group: CustomGroupName<Custom>, assetName: string, entry: Translation.CustomRecord<string, string>) {
        addColorGroupNamesRaw(group, assetName, entry);
    }

    /**
     * Check if an asset is custom, this includes assets created by mirroring groups
     * @param asset The asset
     * @returns True if the asset is custom
     */
    assetIsCustomed (asset: Asset): boolean {
        return getCustomAssets()[asset.Group.Name]?.[asset.Name] !== undefined;
    }

    /**
     * Check if a name of an asset is custom, this **does not** include assets created by mirroring groups
     * @param assetName The name of the asset
     */
    assetNameIsStrictCustomed (assetName: string): boolean {
        return customAssetGetStrict(assetName) !== undefined;
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
        setupCustomAssetString();
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
