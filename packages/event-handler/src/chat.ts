import { HookManager } from '@sugarch/bc-mod-hook-manager';
import { Globals } from '@sugarch/bc-mod-utility';
import EventEmitter from 'eventemitter3';

type ChatRoomMessageEventType = Exclude<ServerChatRoomMessageType, 'ServerMessage' | 'Status'>;

type EventMap = {
    [key in ChatRoomMessageEventType]: [message: ServerChatRoomMessage];
} & {
    PlayerJoin: [player: PlayerCharacter];
    PlayerLeave: [player: PlayerCharacter];
};

type EventType = keyof EventMap;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OnFuncArgs<T extends EventType> = [event: T, listener: (...args: EventMap[T]) => void, context?: any];
class _ChatRoomEvents {
    private handler = new EventEmitter<EventMap>();

    constructor () {
        HookManager.hookFunction('ChatRoomMessage', 10, (args, next) => {
            const { Type } = args[0];
            if(Type !== 'ServerMessage' && Type !== 'Status') 
                this.handler.emit(Type, args[0]);
            return next(args);
        });

        HookManager.hookFunction('ChatRoomSync', 1, (args, next) => {
            if (Player && (!ChatRoomData || !Player.LastChatRoom || ChatRoomData.Name !== Player.LastChatRoom.Name))
                this.handler.emit('PlayerJoin', Player);
            return next(args);
        });

        HookManager.hookFunction('ServerSend', 1, (args, next) => {
            if (args[0] === 'ChatRoomLeave' && Player) this.handler.emit('PlayerLeave', Player);
            return next(args);
        });
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
     * Unregister an event listener
     * @param event - The event to stop listening to
     * @param listener - The listener function
     */
    off<T extends EventType> (...args: OnFuncArgs<T>): void {
        this.handler.off(...args);
    }

    /**
     * Register a one-time event listener
     * @param event - The event to listen to
     * @param listener - The listener function
     */
    once<T extends EventType> (...args: OnFuncArgs<T>): void {
        this.handler.once(...args);
    }
}

/**
 * Chat events emitter, note that the events are emitted before the message is processed by the game.
 */
export const ChatRoomEvents = Globals.get('ChatRoomEvents', () => new _ChatRoomEvents());
