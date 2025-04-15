import { Entries, resolveEntry, solidfyEntry } from './entries';
import { pushGroupLoad } from './loadSchedule';
import { registerMirror } from './mirrorGroup';
import { customGroupAdd } from './customStash';
import { loadAsset } from './assetUtils';
import { resolveStringAsset } from './assetConfigs';
import type { CustomAssetDefinition, CustomGroupDefinition, CustomGroupName, Translation } from "@sugarch/bc-mod-types";

/**
 * Register a custom group
 * @param groupDef Group definition
 * @param param 
 * @param param.translation
 * @param param.dynamicName
 * @param param.preimage
 */
export function loadGroup<Custom extends string = AssetGroupBodyName> (
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
        customGroupAdd('Female3DCG', groupDef as AssetGroupDefinition).then(grp => {
            grp.Description = resolveEntry(solidDesc);
            if (dynamicName) grp.DynamicGroupName = dynamicName as AssetGroupName;

            groupDef.Asset.forEach(asset => {
                loadAsset(
                    groupDef.Group,
                    resolveStringAsset(asset as string | AssetDefinition) as CustomAssetDefinition<Custom>,
                    {
                        dynamicName,
                        preimage,
                    }
                );
            });
        });
        // Register the name in entry management, if the game gets the name through asynchronous loading, correct it in entry management
        Entries.setGroup(groupDef.Group, solidDesc);
    });
}

/** Track missing groups to prevent repeated errors */
const missingGroup = new Set<CustomGroupName>();

/**
 * Mirror a group configuration to create a new group based on an existing one
 * @param newGroup
 * @param copyFrom
 * @param translation
 */
export function mirrorGroup<Custom extends string = AssetGroupBodyName> (
    newGroup: CustomGroupName<Custom>,
    copyFrom: CustomGroupName,
    translation?: Translation.Entry
) {
    const wk = () => {
        const fromDef = AssetFemale3DCG.find(def => def.Group === copyFrom);
        const fromGrp = AssetGroupGet('Female3DCG', copyFrom as AssetGroupName);
        const fromExt = AssetFemale3DCGExtended[copyFrom];

        if (!fromDef || !fromGrp) {
            // If the group can't be found twice, it either doesn't exist or there's a circular dependency
            if (missingGroup.has(copyFrom)) {
                console.error(`[AssetManager] Group ${copyFrom} not found`);
                return;
            }

            // If the group doesn't exist, put wk back in the queue
            missingGroup.add(copyFrom);
            pushGroupLoad(wk);
            return;
        }

        registerMirror(copyFrom as CustomGroupName<Custom>, newGroup);

        const soldDesc = solidfyEntry(translation, newGroup.replace(/_.*?Luzi$/, ''));

        loadGroup(
            {
                ...fromDef,
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
    pushGroupLoad(wk);
}
