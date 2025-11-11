import { ActivityInfo, ActivityTriggerMode, Translation } from "@sugarch/bc-mod-types";

export type CustomActivityPrerequisite<CustomPrereq extends string = ActivityPrerequisite> =
    | ActivityPrerequisite
    | CustomPrereq;

/* eslint-disable @typescript-eslint/no-explicit-any */
export type PrerequisiteCheckFunction<CustomPrereq extends string = ActivityPrerequisite> = (
    prerequisite: CustomPrereq,
    ...args: Parameters<(typeof globalThis)["ActivityCheckPrerequisite"]> extends [any, ...infer Rest] ? Rest : never
) => ReturnType<(typeof globalThis)["ActivityCheckPrerequisite"]>;
/* eslint-enable @typescript-eslint/no-explicit-any */

export type ExCustomActivityPrerequisite<CustomPrereq extends string = ActivityPrerequisite> =
    | CustomActivityPrerequisite<CustomPrereq>
    | PrerequisiteCheckFunction;

type AnyActivityName = string;

export type CustomActivityDefinition<
    CustomAct extends string = string,
    CustomPrereq extends string = ActivityPrerequisite
> = Omit<Activity, "Name" | "Prerequisite" | "ActivityID"> & {
    Name: CustomAct;
    ActivityID?: number;
    Prerequisite: ExCustomActivityPrerequisite<CustomPrereq>[];
};

/**
 * A dynamic activity image provider function.
 * @param activity - The activity to get the image for.
 * @param target - The target character of the activity.
 * @param group - The targeted group name of the activity.
 * @returns The image URL or undefined if no image is available.
 */
export type DynamicActivityImageProvider = (activity: Activity, target: Character, group: string) => string | undefined;

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
    | DynamicActivityImageProvider
    | `${"http://" | "https://"}${string}`
    | `data:image/${string}`
    | "None";

export type ActivityDialogKey = `Chat${"Other" | "Self"}-${AssetGroupItemName}-${AnyActivityName}`;

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
    /** trigger mode, if undefined, will trigger  */
    readonly mode?: ActivityTriggerMode;
    run?: (player: PlayerCharacter, sender: Character, info: ActivityInfo) => void;
}

/**
 * An activity modifier.
 */
export interface ActivityExtendedEvent extends Required<ActivityRunnable> {
    readonly name: ActivityName;
}

export type ExtItemActivity<CustomAct extends string = string> = Omit<ItemActivity, "Activity"> & {
    readonly Activity: CustomAct;
};

/**
 * Represents a custom activity.
 */
export interface CustomActivity<CustomAct extends string = string, CustomPrereq extends string = ActivityPrerequisite>
    extends ActivityRunnable {
    readonly activity: CustomActivityDefinition<CustomAct, CustomPrereq>;

    /** The image for activity in dialog, see {@link ActivityImageSetting} for details */
    readonly useImage?: ActivityImageSetting;

    /**
     * An optional function to override the default activity behavior.
     * This function will be called when the activity in the dialog is clicked.
     * And further activity processing will be skipped.
     * It can be used to customize the behavior of the activity.
     * @param actor the actor of the activity, always the player
     * @param acted the activity target
     * @param targetGroup the target group of the activity
     * @param info the activity info, an extended version of {@link ItemActivity}
     * @returns void
     */
    readonly override?: (
        actor: Character,
        acted: Character,
        targetGroup: AssetItemGroup,
        info: ExtItemActivity<CustomAct>
    ) => void;

    /**
     * An optional function to get the item used in the activity.
     * @param actor the actor of the activity, always the player
     * @param acted the activity target
     * @param targetGroup the target group of the activity
     * @param info the activity info, an extended version of {@link ItemActivity}
     * @returns The item used in the activity, or undefined if no item is used.
     */
    readonly item?: (
        actor: Character,
        acted: Character,
        targetGroup: AssetItemGroup,
        info: ExtItemActivity<CustomAct>
    ) => Item | null | undefined;

    /**
     * An optional function to process chat message dictionary entries.
     * @param prev previous dictionary entries
     * @param actor the actor of the activity, always the player
     * @param acted the activity target
     * @param targetGroup the target group of the activity
     * @param info the activity info, an extended version of {@link ItemActivity}
     * @returns
     */
    readonly dictionary?: (
        prev: ChatMessageDictionaryEntry[],
        actor: Character,
        acted: Character,
        targetGroup: AssetItemGroup,
        info: ExtItemActivity<CustomAct>
    ) => ChatMessageDictionaryEntry[] | undefined;

    /** The activity name when used on others */
    readonly label?: Translation.ActivityEntry | Translation.Entry;
    /** The dialog when used on others */
    readonly dialog?: Translation.ActivityEntry | Translation.Entry;
    /** The activity name when used on self, defaults to label if not defined */
    readonly labelSelf?: Translation.ActivityEntry | Translation.Entry;
    /** The dialog when used on self, defaults to dialog if not defined */
    readonly dialogSelf?: Translation.ActivityEntry | Translation.Entry;
}
