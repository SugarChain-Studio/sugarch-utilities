import { ImageMapping } from '@sugarch/bc-image-mapping';
import { ImageMappingRecord } from '@sugarch/bc-mod-types';
import { ActivityImageSetting, CustomActivityDefinition } from './types';
import { PathTools } from '@sugarch/bc-mod-utility';

/**
 * Add custom activity image mappings
 * @param mappings - Record of activity names to image names
 * @param category - Category of the mapping (Activity or an asset group)
 */
export function addActivityImageMapping<
    CustomAct extends string = string,
    CustomPrereq extends string = ActivityPrerequisite
> (activity: CustomActivityDefinition<CustomAct, CustomPrereq>, useImage: ActivityImageSetting | undefined): void {
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
