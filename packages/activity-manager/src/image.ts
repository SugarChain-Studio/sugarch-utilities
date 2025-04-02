import { ImageMapping } from '@sugarch/bc-image-mapping';
import { ImageMappingRecord } from '@sugarch/bc-mod-types';
import { ActivityImageSetting, CustomActivityDefinition, DynamicActivityImageProvider } from './types';
import { PathTools } from '@sugarch/bc-mod-utility';
import { HookManager } from '@sugarch/bc-mod-hook-manager';

/**
 * Add custom activity image mappings
 * @param mappings - Record of activity names to image names
 * @param category - Category of the mapping (Activity or an asset group)
 */
export function addActivityImageMapping<
    CustomAct extends string = string,
    CustomPrereq extends string = ActivityPrerequisite
> (activity: CustomActivityDefinition<CustomAct, CustomPrereq>, useImage: ActivityImageSetting | undefined): void {
    if(typeof useImage === 'function') {
        dynamicActivityImageProviders[activity.Name] = useImage;
        return;
    }

    const mappingRecord: ImageMappingRecord = {};
    const key = PathTools.activityPreviewIconPath(activity as Activity);
    if (Array.isArray(useImage)) {
        mappingRecord[key] = `Assets/Female3DCG/${useImage[0]}/Preview/${useImage[1]}.png`;
    } else if (useImage === 'None' || useImage === undefined) {
        mappingRecord[key] = PathTools.emptyImage;
    } else if (useImage.startsWith('http') || useImage.startsWith('data:image')) {
        mappingRecord[key] = useImage;
    } else {
        mappingRecord[key] = PathTools.activityPreviewIconPath({ Name: useImage } as Activity);
    }
    ImageMapping.addImgMapping(mappingRecord);
}

const dynamicActivityImageProviders: Record<string, DynamicActivityImageProvider> = {};

export function setupDynamicActivityImage () {
    // priority should be higher than the image mapping facility (priority = 0)
    HookManager.hookFunction('ElementButton.CreateForActivity', 1, (args, next) => {
        const [_, activitiy, target] = args;
        
        console.warn('[DEBUG] ElementButton hook run x1!');

        const provider = dynamicActivityImageProviders[activitiy.Activity.Name];
        if (provider) {
            const image = provider(activitiy.Activity, target, activitiy.Group) ?? PathTools.emptyImage;
            if (image) args[4] = { ...args[4], image };
        }
        return next(args);
    });
}
