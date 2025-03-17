import { ModManager } from "@sugarch/bc-mod-manager";
import { Globals } from "@sugarch/bc-shared-utility";
import EventEmitter from "eventemitter3";

// Define custom event emitter interface with our specific events
type ChatRoomEventEmitter = EventEmitter<{
    [key in ServerChatRoomMessageType]: [ServerChatRoomMessage];
}>;

// Module's event handler instance
let handler: ChatRoomEventEmitter | undefined = undefined;

class _ChatRoomEvents {
    constructor() {
        if(handler !== undefined) return;

        handler = new EventEmitter();

        ModManager.hookFunction("ChatRoomMessage", 10, (args, next) => {
            const { Type } = args[0];
            handler!.emit(Type, args[0]);
            return next(args);
        });
    }

    /**
     * Register an event listener
     * @param args
     */
    on<T extends ServerChatRoomMessageType>(
        event: T,
        listener: (message: ServerChatRoomMessage) => void,
        context?: any
    ): void {
        handler!.on(event, listener, context);
    }

    /**
     * Register a one-time event listener
     * @param args
     */
    once<T extends ServerChatRoomMessageType>(
        event: T,
        listener: (message: ServerChatRoomMessage) => void,
        context?: any
    ): void {
        handler!.once(event, listener, context);
    }
}

export const ChatRoomEvents = Globals.get("ChatRoomEvents", () => new _ChatRoomEvents());