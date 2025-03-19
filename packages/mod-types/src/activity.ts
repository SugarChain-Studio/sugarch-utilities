export interface ActivityInfo {
    SourceCharacter: Character;
    TargetCharacter: number;
    ActivityGroup: AssetItemGroup;
    ActivityName: string;
    Asset?: {
        Asset: Asset;
        CraftName?: string;
    };
    Dictionary: ChatMessageDictionaryEntry[];
}