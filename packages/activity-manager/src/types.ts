import { ActivityInfo, Translation } from '@sugarch/bc-mod-types';

export type CustomActivityPrerequisite<CustomPrereq extends string = ActivityPrerequisite> =
    | ActivityPrerequisite
    | CustomPrereq;

export type PrerequisiteCheckFunction = typeof globalThis['ActivityCheckPrerequisite'];

export type ExCustomActivityPrerequisite<CustomPrereq extends string = ActivityPrerequisite> =
    | CustomActivityPrerequisite<CustomPrereq>
    | PrerequisiteCheckFunction;

type AnyActivityName = string;

export type CustomActivityDefinition<CustomPrereq extends string = ActivityPrerequisite> = Omit<
    Activity,
    'Name' | 'Prerequisite' | 'ActivityID'
> & {
    Name: AnyActivityName;
    ActivityID?: number;
    Prerequisite: ExCustomActivityPrerequisite<CustomPrereq>[];
};

/**
 * Represents a custom activity image setting.
 * - ActivityName: reuses the image of the corresponding activity.
 * - [group name, item name]: reuses the image of the corresponding item.
 * - http/https URL: uses the image from given URL.
 * - data:image URL: uses the image from the data URL.
 * - 'None': uses an empty image.
 */
export type ActivityImageSetting =
    | [AssetGroupName, string]
    | ActivityName
    | `${'http://' | 'https://'}${string}`
    | `data:image/${string}`
    | 'None';

export type ActivityDialogKey = `Chat${'Other' | 'Self'}-${AssetGroupItemName}-${AnyActivityName}`;

export type ActivityTriggerMode = 'SelfOnOthers' | 'OthersOnSelf' | 'SelfOnSelf' | 'AnyOnSelf';

/**
 * A custom activity prerequisite, with name and test function
 */
export interface CustomActivityPrerequisiteItem<CustomPrereq extends string = ActivityPrerequisite> {
    readonly name: CustomActivityPrerequisite<CustomPrereq>;
    readonly test: PrerequisiteCheckFunction;
}

/**
 * A runnable activity.
 */
export interface ActivityRunnable {
    readonly mode?: ActivityTriggerMode;
    run?: (player: PlayerCharacter, sender: Character, info: ActivityInfo) => void;
}

/**
 * An activity modifier.
 */
export interface ActivityExtendedEvent extends Required<ActivityRunnable> {
    readonly name: ActivityName;
}

/**
 * Represents a custom activity.
 */
export interface CustomActivity<CustomPrereq extends string = ActivityPrerequisite>
    extends ActivityRunnable {
    readonly activity: CustomActivityDefinition<CustomPrereq>;

    /** The image for activity in dialog, see {@link ActivityImageSetting} for details */
    readonly useImage?: ActivityImageSetting;

    /** The activity name when used on others */
    readonly label?: Translation.ActivityEntry | Translation.Entry;
    /** The dialog when used on others */
    readonly dialog?: Translation.ActivityEntry | Translation.Entry;
    /** The activity name when used on self, defaults to label if not defined */
    readonly labelSelf?: Translation.ActivityEntry | Translation.Entry;
    /** The dialog when used on self, defaults to dialog if not defined */
    readonly dialogSelf?: Translation.ActivityEntry | Translation.Entry;
}
