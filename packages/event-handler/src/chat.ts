import { HookManager } from '@sugarch/bc-mod-hook-manager';
import { Globals } from '@sugarch/bc-mod-utility';
import EventEmitter from 'eventemitter3';

type EventType = ServerChatRoomMessageType;

type EventMap = {
    [key in EventType]: [message: ServerChatRoomMessage];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OnFuncArgs<T extends EventType> = [event: T, listener: (message: ServerChatRoomMessage) => void, context?: any];

class _ChatRoomEvents {
    private handler = new EventEmitter<EventMap>();

    constructor () {
        HookManager.hookFunction('ChatRoomMessage', 10, (args, next) => {
            const { Type } = args[0];
            this.handler.emit(Type, args[0]);
            return next(args);
        });
    }

    /**
     * Register an event listener
     */
    on<T extends EventType> (...args: OnFuncArgs<T>): void {
        this.handler.on(...args);
    }

    /**
     * Register a one-time event listener
     */
    once<T extends EventType> (...args: OnFuncArgs<T>): void {
        this.handler.once(...args);
    }
}

/**
 * Chat events emitter, note that the events are emitted before the message is processed by the game.
 */
export const ChatRoomEvents = Globals.get('ChatRoomEvents', () => new _ChatRoomEvents());
