export interface ActivityInfo {
    SourceCharacter: number;
    SourceCharacterC: Character;
    TargetCharacter: number;
    ActivityGroup: AssetItemGroup;
    ActivityName: string;
    Asset?: {
        Asset: Asset;
        CraftName?: string;
    };
    Dictionary: ChatMessageDictionaryEntry[];
}

/**
 * Triggering mode of an activity handler
 * - SelfOnOthers: when the player play the activity on others
 * - OthersOnSelf: when others play the activity on the player
 * - SelfOnSelf: when the player play the activity on themselves
 * - AnyOnSelf: when the player or others play the activity on the player
 * - SelfInvolved: when the player is involved in the activity
 */
export type ActivityTriggerMode = 'SelfOnOthers' | 'OthersOnSelf' | 'SelfOnSelf' | 'AnyOnSelf' | 'SelfInvolved';