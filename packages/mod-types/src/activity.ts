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