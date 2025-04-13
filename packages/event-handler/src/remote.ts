import { ChatRoomEvents } from './chat';

/**
 * List of known invalid events that should not be handled
 * due to system restrictions or security concerns:
 *  "TakeSuitcase",
 *  "RuleInfoGet",
 *  "ReceiveSuitcaseMoney",
 *  "SlowLeaveInterrupt",
 *  "PingHoldLeash",
 *  "StruggleAssist",
 *  "GiveLockpicks",
 *  "HoldLeash",
 *  "RemoveLeash",
 *  "StopHoldLeash",
 *  "PingHoldLeash",
 *  "SlowStop",
 *  "OnlineStruggleInterrupt",
 *  "MaidDrinkPick",
 *  "RequestFullKinkyDungeonData"
 *
 * List of invalid prefixes that should not be used
 * to avoid conflicts with built-in functionality:
 *  "OwnerRule" "LoverRule" "PayQuest" "ChatRoomBot" "Pandora" "PortalLink"
 */

/**
 * Sends a custom event through the chat room system using hidden messages
 * @param event - The event name to be sent
 * @param arg - The arguments to send with the event
 * @param target - Optional target member number for private events
 */
function sendEvent (event: string, arg: object, target?: number) {
    ServerSend('ChatRoomChat', {
        Type: 'Hidden',
        ...(target ? { Target: target } : {}),
        Content: event,
        Dictionary: [{ rEventArg: JSON.stringify(arg) }],
    });
}

// Set of prefixes that cannot be used for custom events to prevent conflicts
const invalidPrefix = new Set(['OwnerRule', 'LoverRule', 'PayQuest', 'ChatRoomBot', 'Pandora', 'PortalLink']);

/**
 * Type utility to extract event names from an event types object
 * @template T - The event types object
 */
type EventNames<T extends object> = keyof T extends string ? keyof T : never;

/**
 * Type utility to extract argument types for a specific event
 * @template T - The event types object
 * @template K - The specific event key
 */
type EventArgs<T extends Object, K extends keyof T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => void ? Parameters<T[K]> : T[K] extends any[] ? T[K] : never;
}[K];

/**
 * Event message information
 */
interface EventInfo {
    sender: number;
    senderCharacter: Character;
}

/**
 * Type for event listener functions
 * @template T - The event types object
 * @template K - The specific event key
 */
type EventListener<T extends object, K extends keyof T> = (info:EventInfo, ...args: EventArgs<T, K>) => void;

/**
 * Internal interface for storing event listeners
 */
interface _EventItem {
    /** The event listener function */
    fn: (...args: any[]) => void;
    /** Whether this is a one-time listener */
    once: boolean;
}

/**
 * A class for handling remote events through the chat room system
 * @template EventTypes - Object defining the event names and their argument types
 */
export class ChatRoomRemoteEventEmitter<EventTypes extends object> {
    /** Prefix used to identify events from this emitter */
    private prefix: string;
    /** Map of registered event listeners */
    private _events: Record<string, _EventItem[]> = {};

    /**
     * Creates a new remote event emitter
     * @param prefix - Unique prefix to identify events from this emitter
     * @throws Error if the prefix is in the invalid list
     */
    constructor (prefix: string) {
        this.prefix = prefix;
        if (invalidPrefix.has(prefix)) {
            throw new Error(`Invalid remote event prefix: ${prefix}`);
        }

        // Register listener for hidden messages to capture remote events
        ChatRoomEvents.on('Hidden', message => this.tryInvoke(message));
    }

    /**
     * Attempts to invoke event listeners for a received message
     * @param data - The chat room message data
     */
    private tryInvoke (data: ServerChatRoomMessage) {
        // Extract the event name by removing the prefix
        const event = data.Content.slice(this.prefix.length);
        // Find the event arguments in the message dictionary
        const argData = data?.Dictionary?.find(item => (item as any).rEventArg) as unknown as { rEventArg: string };
        if (!argData) return;

        const sender = data.Sender;
        const senderCharacter = ChatRoomCharacter.find(c => c.MemberNumber === sender);
        if (!sender || !senderCharacter) return;
        const info: EventInfo = {
            sender,
            senderCharacter,
        };

        try {
            // Parse the event arguments
            const eArgs = JSON.parse(argData.rEventArg);
            if (eArgs && Array.isArray(eArgs)) {
                // Create a copy of listeners to avoid modification during iteration
                let cpListeners: _EventItem[] = [];
                if (this._events[event]) {
                    cpListeners = this._events[event].slice();
                }

                // Keep track of listeners to retain after invocation
                let remainedListeners: _EventItem[] = [];
                for (const listener of cpListeners) {
                    try {
                        // Invoke the listener with the event arguments
                        listener.fn(info, ...eArgs);
                    } catch (e) {
                        console.error(`Error invoking listener for event ${event}:`, e);
                    }
                    // Keep non-once listeners
                    if (!listener.once) {
                        remainedListeners.push(listener);
                    }
                }

                // Update or clean up the listeners list
                if (remainedListeners.length === 0) {
                    delete this._events[event];
                } else {
                    this._events[event] = remainedListeners;
                }
            }
        } catch (e) {
            console.error('Error parsing event args:', e);
        }
    }

    /**
     * Registers an event listener
     * @param event - The event name
     * @param fn - The listener function
     * @returns This emitter instance for chaining
     */
    on<T extends EventNames<EventTypes>> (event: T, fn: EventListener<EventTypes, T>): this {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        this._events[event].push({ fn, once: false });
        return this;
    }

    /**
     * Registers a one-time event listener
     * @param event - The event name
     * @param fn - The listener function
     * @returns This emitter instance for chaining
     */
    once<T extends EventNames<EventTypes>> (event: T, fn: EventListener<EventTypes, T>): this {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        this._events[event].push({ fn, once: true });
        return this;
    }

    /**
     * Removes an event listener
     * @param event - The event name
     * @param fn - Optional specific listener to remove. If not provided, all listeners for the event are removed
     * @returns This emitter instance for chaining
     */
    off<T extends EventNames<EventTypes>> (event: T, fn?: EventListener<EventTypes, T>): this {
        if (!this._events[event]) return this;

        if (fn) {
            this._events[event] = this._events[event].filter(item => item.fn !== fn);
            if (this._events[event].length === 0) {
                delete this._events[event];
            }
        } else {
            delete this._events[event];
        }

        return this;
    }

    /**
     * Emits an event to all players in the chat room
     * @param event - The event name
     * @param args - The event arguments
     */
    emitAll<T extends EventNames<EventTypes>> (event: T, ...args: EventArgs<EventTypes, T>): void {
        sendEvent(`${this.prefix}${event}`, args);
    }

    /**
     * Emits an event to a specific player
     * @param target - The target character or member number
     * @param event - The event name
     * @param args - The event arguments
     */
    emit<T extends EventNames<EventTypes>> (
        target: Character | number,
        event: T,
        ...args: EventArgs<EventTypes, T>
    ): void {
        sendEvent(`${this.prefix}${event}`, args, typeof target === 'number' ? target : target.MemberNumber);
    }
}
