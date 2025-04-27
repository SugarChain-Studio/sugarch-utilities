export interface ActivityInfo {
    /** The character that started the activity */
    SourceCharacter: number;
    /** The character that started the activity, as a Character object */
    SourceCharacterC: Character;
    /** The character that is the target of the activity */
    TargetCharacter: number;
    /** The target group of the activity */
    ActivityGroup: AssetItemGroup;
    /** The name of the activity */
    ActivityName: string;
    /** The asset of the activity, if any */
    Asset?: {
        Asset: Asset;
        CraftName?: string;
    };
    /** The dictionary of the activity */
    Dictionary: ChatMessageDictionaryEntry[];
}

/**
 * Triggering mode of an activity handler
 * - SelfOnOthers: when the player play the activity on others
 * - OthersOnSelf: when others play the activity on the player
 * - SelfOnSelf: when the player play the activity on themselves
 * - AnyOnSelf: when the player or others play the activity on the player
 * - SelfInvolved: when the player is involved in the activity
 * - AnyActivity: when the activity is acted by anyone
 */
export type ActivityTriggerMode = 'SelfOnOthers' | 'OthersOnSelf' | 'SelfOnSelf' | 'AnyOnSelf' | 'SelfInvolved' | 'AnyInvolved';