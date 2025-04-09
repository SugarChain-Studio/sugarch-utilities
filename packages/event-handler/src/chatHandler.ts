import { Globals, sleepUntil } from '@sugarch/bc-mod-utility';
import EventEmitter from 'eventemitter3';
import { version } from './package';

type EventArgType = Parameters<ChatRoomMessageHandler['Callback']>;
type EventType = ServerChatRoomMessageType;

type EventMap = {
    [key in EventType]: EventArgType;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OnFuncArgs<T extends EventType> = [event: T, listener: (...args: EventArgType) => void, context?: any];

/**
 * Create a chat room message handler for activity events
 * @returns A configured chat room message handler
 */
function makeChatRoomMsgHandler (emitter: EventEmitter<EventMap>): ChatRoomMessageHandler {
    return {
        Description: `SugarChain ChatMessage Handler v${version}`,
        Priority: 1024, // The last handler for base BC is 500, choose 1024 as a lucky number
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Callback: (data, sender, msg, metadata) => {
            emitter.emit(data.Type, data, sender, msg, metadata);
            return false;
        },
    };
}

class _ChatRoomMessageHandlerEvents {
    private handler = new EventEmitter<EventMap>();
    constructor () {
        (async () => {
            await sleepUntil(() => Array.isArray(ChatRoomMessageHandlers));
            ChatRoomRegisterMessageHandler(makeChatRoomMsgHandler(this.handler));
        })();
    }

    /**
     * Register an event listener
     * @param event - The event to listen to
     * @param listener - The listener function
     */
    on<T extends EventType> (...args: OnFuncArgs<T>): void {
        this.handler.on(...args);
    }

    /**
     * Register a one-time event listener
     * @param event - The event to listen to
     * @param listener - The listener function
     */
    once<T extends EventType> (...args: OnFuncArgs<T>): void {
        this.handler.once(...args);
    }

    /**
     * Unregister an event listener
     * @param event - The event to stop listening to
     * @param listener - The listener function
     */
    off<T extends EventType> (...args: OnFuncArgs<T>): void {
        this.handler.off(...args);
    }
}

/**
 * Chat handler events emitter, this event is emitted from a message handler in the last process order.
 * Thus hidden messages, either by filter setting or sensory deprivation will not be emitted.
 */
export const ChatRoomMessageHandlerEvents = Globals.get(
    `ChatRoomMessageHandlerEvents@${version}`,
    () => new _ChatRoomMessageHandlerEvents()
);
