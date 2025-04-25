import { ActivityInfo } from "@sugarch/bc-mod-types";

function pullActivityInfo(...args: Parameters<ChatRoomMessageHandler['Callback']>): ActivityInfo | undefined {
    const [data, sender, _, metadata] = args;
    if (data.Type !== 'Activity' || !data.Dictionary || !metadata) return undefined;
    const { ActivityName, ActivityAsset, CraftingNames, FocusGroup, TargetMemberNumber } = metadata;
    if (!ActivityName || !FocusGroup || !TargetMemberNumber || !sender.MemberNumber) return undefined;
    
    const info: ActivityInfo = {
        SourceCharacter: sender.MemberNumber,
        SourceCharacterC: sender,
        TargetCharacter: TargetMemberNumber,
        ActivityGroup: FocusGroup,
        ActivityName: ActivityName,
        Asset:
            ActivityAsset !== undefined
                ? {
                      Asset: ActivityAsset,
                      CraftName: CraftingNames?.['ActivityAsset'],
                  }
                : undefined,
        Dictionary: data.Dictionary,
    };
    
    return info;
}

export const ChatMessageTools = {
    pullActivityInfo,
}