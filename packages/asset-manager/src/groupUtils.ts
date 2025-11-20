import { Entries, resolveEntry, solidfyEntry } from './entries';
import { pushAfterLoad, pushGroupLoad, pushGroupMirrorLoad } from './loadSchedule';
import { registerMirror } from './mirrorGroup';
import { customGroupAdd, getCustomGroups } from './customStash';
import { loadAsset } from './assetUtils';
import { resolveStringAsset } from './assetConfigs';
import type { CustomAssetDefinition, CustomGroupDefinition, CustomGroupName, Translation } from '@sugarch/bc-mod-types';
import { HookManager } from '@sugarch/bc-mod-hook-manager';

const manualConfigs: Record<string, ExtendedItemGroupConfig> = {};

/**
 * some extended item configs are not in the AssetFemale3DCGExtended, we need to pull them out of the ExtendedItemManualRegister
 */
pushGroupLoad(() => {
    let pulling = false;
    HookManager.hookFunction('AssetBuildExtended', 0, (args, next) => {
        if (pulling) {
            const [asset, config] = args;
            manualConfigs[asset.Group.Name] ??= {};
            manualConfigs[asset.Group.Name][asset.Name] = config;
            return null;
        }
        return next(args);
    });

    pulling = true;
    HookManager.invokeOriginal('ExtendedItemManualRegister');
    pulling = false;
});

function rebuildExtendedConfigDialogPrefix<Custom extends string = AssetGroupBodyName>(
    config: AssetArchetypeConfig,
    group: CustomGroupName<Custom>,
    asset: string
): Pick<AssetArchetypeConfig, 'DialogPrefix'> {
    if (!config.DialogPrefix) {
        const key = `${group}${asset}`;
        if (config.Archetype === 'modular')
            return {
                DialogPrefix: {
                    Header: `${key}Select`,
                    Module: `${key}Module`,
                    Option: `${key}Option`,
                    Chat: `${key}Set`,
                },
            };
        else if (config.Archetype === 'typed') {
            return {
                DialogPrefix: {
                    Header: `${key}Select`,
                    Option: key,
                    Chat: `${key}Set`,
                    Npc: key,
                },
            };
        }
    }
    return {};
}

/**
 * Register a custom group
 * @param groupDef Group definition
 * @param param
 * @param param.translation
 * @param param.dynamicName
 * @param param.preimage
 */
export function loadGroup<Custom extends string = AssetGroupBodyName>(
    groupDef: CustomGroupDefinition<Custom>,
    {
        translation,
        dynamicName,
        preimage,
    }: {
        translation?: Translation.Entry;
        dynamicName?: CustomGroupName<Custom>;
        preimage?: AssetGroup;
    } = {}
) {
    pushGroupLoad(() => {
        const solidDesc = solidfyEntry(translation, groupDef.Group.replace(/_.*?Luzi$/, ''));
        customGroupAdd('Female3DCG', groupDef as AssetGroupDefinition).then((grp) => {
            grp.Description = resolveEntry(solidDesc);
            if (dynamicName) grp.DynamicGroupName = dynamicName as AssetGroupName;

            const extendedConfig = (() => {
                if (!preimage) return undefined;
                const srcConfig = AssetFemale3DCGExtended[preimage.Name as AssetGroupName];
                if (!srcConfig) return undefined;

                const ret = {} as ExtendedItemGroupConfig;
                for (const [assetName, config] of Object.entries(srcConfig)) {
                    ret[assetName] = {
                        Archetype: config.Archetype,
                        CopyConfig: { GroupName: preimage.Name, AssetName: assetName },
                        ...rebuildExtendedConfigDialogPrefix(config, preimage.Name, assetName),
                    } as typeof config;
                }
                return { [groupDef.Group]: ret };
            })();

            groupDef.Asset.forEach((asset) => {
                const assetDef = resolveStringAsset(asset as string | AssetDefinition) as CustomAssetDefinition<Custom>;
                if (extendedConfig && preimage) {
                    const manualConfig = manualConfigs[preimage.Name]?.[assetDef.Name];
                    if (manualConfig) {
                        pushAfterLoad(() => {
                            const asset = AssetGet('Female3DCG', groupDef.Group as AssetGroupName, assetDef.Name);
                            if (asset) AssetBuildExtended(asset, manualConfig, extendedConfig, null, false);
                        });
                    }
                }

                loadAsset(groupDef.Group, assetDef, {
                    dynamicName,
                    preimage,
                    extendedConfig,
                });
            });
        });
        // Register the name in entry management, if the game gets the name through asynchronous loading, correct it in entry management
        Entries.setGroup(groupDef.Group, solidDesc);
    });
}

/** Track missing groups to prevent repeated errors */
const missingGroup = new Set<string>();

/**
 * Mirror a group configuration to create a new group based on an existing one
 * @param newGroup
 * @param copyFrom
 * @param translation
 * @param defOverrides
 */
export function mirrorGroup<Custom extends string = AssetGroupBodyName>(
    newGroup: CustomGroupName<Custom>,
    copyFrom: CustomGroupName<Custom>,
    translation?: Translation.Entry,
    defOverrides?: Partial<CustomGroupDefinition<Custom>>
) {
    const wk = () => {
        const fromDef = AssetFemale3DCG.find((def) => def.Group === copyFrom) || getCustomGroups<Custom>()[copyFrom];
        const fromGrp = AssetGroupGet('Female3DCG', copyFrom as AssetGroupName);
        const fromExt = AssetFemale3DCGExtended[copyFrom as AssetGroupBodyName];

        if (!fromDef || !fromGrp) {
            // If the group can't be found twice, it either doesn't exist or there's a circular dependency
            if (missingGroup.has(copyFrom)) {
                console.error(`[AssetManager] Group ${copyFrom} not found`);
                return;
            }

            // If the group doesn't exist, put wk back in the queue
            missingGroup.add(copyFrom);
            pushGroupMirrorLoad(wk);
            return;
        }

        registerMirror(copyFrom as CustomGroupName<Custom>, newGroup);

        const soldDesc = solidfyEntry(translation, newGroup.replace(/_.*?Luzi$/, ''));

        loadGroup(
            {
                ...fromDef,
                ...defOverrides,
                Group: newGroup,
                Default: false,
                Random: false,
            } as CustomGroupDefinition,
            {
                translation: soldDesc,
                dynamicName: fromDef.DynamicGroupName || fromDef.Group,
                preimage: fromGrp,
            }
        );
        AssetFemale3DCGExtended[newGroup as AssetGroupBodyName] = fromExt;
    };
    pushGroupMirrorLoad(wk);
}
