import { ActivityInfo, ActivityTriggerMode } from '@sugarch/bc-mod-types';
import { Globals, sleepUntil } from '@sugarch/bc-mod-utility';

type EventMode = ActivityTriggerMode;

type EventArgType = [sender: Character, player: PlayerCharacter, info: ActivityInfo];

type Handler = {
    mode: EventMode;
    activity: string;
    listener: (...args: EventArgType) => void;
};

type HandlerRunner = (modes: EventMode[], activityName: string, ...args: EventArgType) => void;

/**
 * Create a chat room message handler for activity events
 * @returns A configured chat room message handler
 */
function makeChatRoomMsgHandler (runner: HandlerRunner): ChatRoomMessageHandler {
    return {
        Description: `SugarChain Activity Handler`,
        Priority: 290, // must between 210 (arousal processing) and 300 (sensory deprivation)
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Callback: (data, sender, msg, metadata) => {
            if (data.Type !== 'Activity' || !data.Dictionary || !metadata) return false;

            const { ActivityName, ActivityAsset, CraftingNames, FocusGroup, TargetMemberNumber } = metadata;
            if (!ActivityName || !FocusGroup || !TargetMemberNumber || !sender.MemberNumber) return false;

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

            const mode: EventMode[] = (() => {
                if (TargetMemberNumber === Player.MemberNumber) {
                    if (sender.MemberNumber === TargetMemberNumber) return ['SelfOnSelf', 'AnyOnSelf', 'SelfInvolved'];
                    return ['OthersOnSelf', 'AnyOnSelf', 'SelfInvolved'];
                }
                if (sender.MemberNumber === Player.MemberNumber) return ['SelfOnOthers', 'SelfInvolved'];
                return [];
            })();

            if (mode.length === 0) return false;

            runner(mode, ActivityName, sender, Player, info);

            return false;
        },
    };
}
class _ActivityEvents<T extends string = ActivityName> {
    private _handers: Handler[] = [];

    constructor () {
        (async () => {
            await sleepUntil(() => Array.isArray(ChatRoomMessageHandlers));
            ChatRoomRegisterMessageHandler(makeChatRoomMsgHandler((...args) => this.emit(...args)));
        })();
    }

    private emit (modes: EventMode[], activityName: string, ...args: EventArgType) {
        this._handers
            .filter(handler => activityName === handler.activity && modes.includes(handler.mode))
            .forEach(async handler => handler.listener(...args));
    }

    /**
     * Register an event listener
     * @param mode - The event mode to listen to
     * @param activity - The activity name to listen to
     * @param listener - The listener function
     */
    on<U extends EventMode> (mode: U, activity: T, listener: (...args: EventArgType) => void): void {
        this._handers.push({ mode, activity, listener });
    }

    /**
     * Unregister an event listener
     * @param mode - The event mode to stop listening to
     * @param activity - The activity name to stop listening to
     * @param listener - The listener function
     */
    off<U extends EventMode> (mode: U, activity: T, listener: (...args: EventArgType) => void): void {
        this._handers = this._handers.filter(handler => handler.mode !== mode || handler.activity !== activity || handler.listener !== listener);
    }
}

/**
 * Chat handler events emitter, this event is emitted from a message handler in the last process order.
 * Thus hidden messages, either by filter setting or sensory deprivation will not be emitted.
 */
export const ActivityEvents = Globals.get('ActivityEvents', () => new _ActivityEvents());
