import { HookManager } from "@sugarch/bc-mod-hook-manager";
import { Globals } from "@sugarch/bc-mod-utility";

type AllowedClientToServerEvents = Pick<ClientToServerEvents,
    | "ChatRoomChat"
    | "ChatRoomCharacterUpdate"
    | "ChatRoomCharacterExpressionUpdate"
    | "ChatRoomCharacterPoseUpdate"
    | "ChatRoomCharacterArousalUpdate"
    | "ChatRoomCharacterItemUpdate"
    | "ChatRoomCharacterMapDataUpdate"
    | "ChatRoomGame"
>

type SendArgType<T extends keyof ClientToServerEvents> = Parameters<ClientToServerEvents[T]>[0];

type ModiferFunction<T extends keyof AllowedClientToServerEvents> = (args:SendArgType<T>) => SendArgType<T>;

type ServerSendModifiers = {
    [K in keyof AllowedClientToServerEvents]: ModiferFunction<K>[];
};

class _ServerSendModifers {
    private modifiers: ServerSendModifiers = {
        ChatRoomChat: [],
        ChatRoomCharacterUpdate: [],
        ChatRoomCharacterExpressionUpdate: [],
        ChatRoomCharacterPoseUpdate: [],
        ChatRoomCharacterArousalUpdate: [],
        ChatRoomCharacterItemUpdate: [],
        ChatRoomCharacterMapDataUpdate: [],
        ChatRoomGame: []
    };

    isAllowed(event: string): event is keyof AllowedClientToServerEvents {
        return (event in this.modifiers);
    }

    constructor() {
        HookManager.hookFunction('ServerSend', 10, (args, next) => {
            const [event, data] = args;
            if(this.isAllowed(event)) {
                const modifiers = this.modifiers[event];
                for (const modifier of modifiers) {
                    args[1] = modifier(data);
                }
            }
            return next(args);
        });
    }

    /**
     * Register an modifier, note that the modifiers are applied in the order they are registered.
     * 
     * Modifiers are applied to the data before it is sent to the server. Thus, modifers can
     * not be invoked asynchronously.
     * @param event - The event to modify
     * @param modifier - The modifier function
     * 
     * @example
     * ```ts
     *    ServerSendModifiers.addModifier('ChatRoomChat', (data) => {
     *       data.Message = 'Hello world';
     *       return data;
     *    });
     * ```
     */
    addModifier<T extends keyof AllowedClientToServerEvents>(event: T, modifier: ModiferFunction<T>) {
        this.modifiers[event].push(modifier);
    }

    /**
     * Remove an modifier
     * @param event - The event to modify
     * @param modifier - The modifier function
     */
    removeModifier<T extends keyof AllowedClientToServerEvents>(event: T, modifier: ModiferFunction<T>) {
        const index = this.modifiers[event].indexOf(modifier);
        if (index > -1) {
            this.modifiers[event].splice(index, 1);
        }
    }
}

export const ServerSendModifiers = Globals.get('ServerSendModifiers', () => new _ServerSendModifers());