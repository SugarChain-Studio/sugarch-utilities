export class Messager {
    /**
     * @param CUSTOM_ACTION_TAG - Custom tag used for action messages.
     */
    constructor (private readonly CUSTOM_ACTION_TAG: string = 'LUZI_MESSAGE_TAG') {}

    /**
     * Sends a custom action message to the chat room.
     * @param Content - The content of the action message.
     */
    public action (Content: string): void {
        if (!Content || !Player || !Player.MemberNumber) return;
        const DictItem = (content: string) => ({
            Tag: `MISSING TEXT IN "Interface.csv": ${this.CUSTOM_ACTION_TAG}`,
            Text: content,
        });
        ServerSend('ChatRoomChat', {
            Content: this.CUSTOM_ACTION_TAG,
            Type: 'Action',
            Dictionary: [DictItem(Content)],
        });
    }

    /**
     * Sends a chat message to the chat room.
     * @param Content - The content of the chat message.
     */
    public chat (Content: string): void {
        if (!Content || !Player || !Player.MemberNumber) return;
        ServerSend('ChatRoomChat', {
            Content: Content,
            Type: 'Chat',
        });
    }

    /**
     * Sends a local action message to the chat room (only visible locally).
     * @param Content - The content of the local action message.
     * @param Timeout - Optional timeout for the message.
     */
    public localAction (Content: string, Timeout?: number): void {
        if (!Content || !Player || !Player.MemberNumber) return;
        const DictItem = (content: string) => ({
            Tag: `MISSING TEXT IN "Interface.csv": ${this.CUSTOM_ACTION_TAG}`,
            Text: content,
        });
        ChatRoomMessage({
            Sender: Player.MemberNumber,
            Content: this.CUSTOM_ACTION_TAG,
            Type: 'Action',
            Dictionary: [DictItem(Content)],
            Timeout,
        });
    }

    /**
     * Sends a local informational message to the chat room (only visible locally).
     * @param Content - The content of the informational message.
     * @param Timeout - Optional timeout for the message.
     */
    public localInfo (Content: string, Timeout?: number): void {
        if (!Content || !Player || !Player.MemberNumber) return;
        ChatRoomMessage({
            Sender: Player.MemberNumber,
            Content: Content,
            Type: 'LocalMessage',
            Timeout,
        });
    }

    /**
     * Sends a whisper message to a specific target in the chat room.
     * @param target - The member number of the target.
     * @param Content - The content of the whisper message.
     */
    public whisper (target: number, Content: string): void {
        if (!Content || !Player || !Player.MemberNumber) return;
        ServerSend('ChatRoomChat', {
            Content: Content,
            Type: 'Whisper',
            Target: target,
        });
    }

    /**
     * Sends a beep message to a specific target.
     * @param target - The member number of the target.
     * @param Content - The content of the beep message.
     */
    public beep (target: number, Content: string): void {
        if (!Content || !Player || !Player.MemberNumber) return;
        ServerSend('AccountBeep', {
            MemberNumber: target,
            Message: Content,
            BeepType: '',
            IsSecret: false,
        });
    }
}
