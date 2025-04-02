type CustomActionTextOption =
    | {
          tag: string;
          text: string;
      }
    | {
          tag: string;
          textToLookup: string;
      };

type CustomActionActivityOption = {
    /** activity name */
    name: ActivityName;
    /** activitiy target group name */
    group: AssetGroupItemName;
    /** activity associated item, if any */
    item?: Item;
    /** activity associated count, e.g buttplugs */
    count?: number;
};

interface CustomActionOptions {
    /**
     * source character field, if set to true, the Player character will be used as the source character
     * See {@link DictionaryBuilder.sourceCharacter} for more details.
     */
    source?: boolean | Character;
    /**
     * Target character field
     * See {@link DictionaryBuilder.destinationCharacter} for more details.
     */
    destination?: Character;
    /**
     * Target group field, applied before {@link CustomActionOptions.activity}
     * See {@link DictionaryBuilder.focusGroup} for more details.
     */
    group?: AssetGroupItemName;
    /**
     * Text field, used to contruct the action message
     * See {@link DictionaryBuilder.text} and {@link DictionaryBuilder.textLookup} for more details.
     */
    text?: CustomActionTextOption | CustomActionTextOption[];
    /**
     * Activity field, contains the activity name and group, and optionally the item and count
     * See {@link DictionaryBuilder.performActivity} for more details.
     */
    activity?: CustomActionActivityOption;

    /**
     * Asset field, used to construct the action message
     * See {@link DictionaryBuilder.asset} for more details.
     */
    asset?: Asset | { asset: Asset; tag?: string; craftName?: string };
}

function addTextToDictionary (dict: DictionaryBuilder, text: CustomActionTextOption) {
    if ('textToLookup' in text) {
        dict.textLookup(text.tag, text.textToLookup);
    } else {
        dict.text(text.tag, text.text);
    }
}

export class Messager {
    /**
     * @param CUSTOM_ACTION_TAG - Custom tag used for action messages. this should never be conflicted with any other text tag in the message.
     */
    constructor (private readonly CUSTOM_ACTION_TAG: string = 'LUZI_MESSAGE_TAG') {}

    /**
     * Sends a custom action message to the chat room.
     * @param content - The content of the action message.
     */
    public action (content: string, option?: CustomActionOptions): void {
        if (!content || !Player || !Player.MemberNumber) return;
        if (!ServerPlayerIsInChatRoom()) return;
        const dict = new DictionaryBuilder();
        dict.text(`MISSING TEXT IN "Interface.csv": ${this.CUSTOM_ACTION_TAG}`, content);

        if (option?.source) {
            if (option.source === true) {
                dict.sourceCharacter(Player);
            } else {
                dict.sourceCharacter(option.source);
            }
        }
        if (option?.destination) {
            dict.destinationCharacter(option.destination);
        }
        if (option?.text) {
            if (Array.isArray(option.text)) {
                option.text.forEach(text => addTextToDictionary(dict, text));
            } else {
                addTextToDictionary(dict, option.text);
            }
        }
        if(option?.group) {
            dict.focusGroup(option.group);
        }
        if (option?.activity) {
            const { name, group, item, count } = option.activity;
            dict.performActivity(name, { Name: group } as AssetGroup, item, count);
        }
        if (option?.asset) {
            if ('asset' in option.asset) {
                dict.asset(option.asset.asset, option.asset.tag ?? "AssetName", option.asset.craftName);
            } else {
                dict.asset(option.asset);
            }
        }

        ServerSend('ChatRoomChat', {
            Content: this.CUSTOM_ACTION_TAG,
            Type: 'Action',
            Dictionary: dict.build(),
        });
    }

    /**
     * Sends a chat message to the chat room.
     * @param content - The content of the chat message.
     */
    public chat (content: string): void {
        if (!content || !Player || !Player.MemberNumber) return;
        if (!ServerPlayerIsInChatRoom()) return;
        ServerSend('ChatRoomChat', {
            Content: content,
            Type: 'Chat',
        });
    }

    /**
     * Sends a local action message to the chat room (only visible locally).
     * @param content - The content of the local action message.
     * @param timeout - Optional timeout for the message.
     */
    public localAction (content: string, timeout?: number): void {
        if (!content || !Player || !Player.MemberNumber) return;
        if (!ServerPlayerIsInChatRoom()) return;
        const DictItem = (content: string) => ({
            Tag: `MISSING TEXT IN "Interface.csv": ${this.CUSTOM_ACTION_TAG}`,
            Text: content,
        });
        ChatRoomMessage({
            Sender: Player.MemberNumber,
            Content: this.CUSTOM_ACTION_TAG,
            Type: 'Action',
            Dictionary: [DictItem(content)],
            Timeout: timeout,
        });
    }

    /**
     * Sends a local informational message to the chat room (only visible locally).
     * @param content - The content of the informational message.
     * @param timeout - Optional timeout for the message.
     */
    public localInfo (content: string, timeout?: number): void {
        if (!content || !Player || !Player.MemberNumber) return;
        if (!ServerPlayerIsInChatRoom()) return;
        ChatRoomMessage({
            Sender: Player.MemberNumber,
            Content: content,
            Type: 'LocalMessage',
            Timeout: timeout,
        });
    }

    /**
     * Sends a whisper message to a specific target in the chat room.
     * @param target - The member number of the target.
     * @param content - The content of the whisper message.
     */
    public whisper (target: number, content: string): void {
        if (!content || !Player || !Player.MemberNumber) return;
        if (!ServerPlayerIsInChatRoom()) return;
        ServerSend('ChatRoomChat', {
            Content: content,
            Type: 'Whisper',
            Target: target,
        });
    }

    /**
     * Sends a beep message to a specific target.
     * @param target - The member number of the target.
     * @param content - The content of the beep message.
     */
    public beep (target: number, content: string): void {
        if (!content || !Player || !Player.MemberNumber) return;
        ServerSend('AccountBeep', {
            MemberNumber: target,
            Message: content,
            BeepType: '',
            IsSecret: false,
        });
    }
}
