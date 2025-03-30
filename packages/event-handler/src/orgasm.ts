import { HookManager } from '@sugarch/bc-mod-hook-manager';
import { Globals } from '@sugarch/bc-mod-utility';
import EventEmitter from 'eventemitter3';

// Define types for orgasm events
type EventType = 'orgasmed' | 'ruined' | 'resisted';

// Define custom event emitter interface with our specific events
type EventMap = {
    orgasmed: [{ Player: Character }];
    ruined: [{ Player: Character }];
    resisted: [{ Player: Character }];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OnFuncArgs<T extends EventType> = [event: T, listener: (eventData: { Player: Character }) => void, context?: any];

class _OrgasmEvents {
    private handler = new EventEmitter<EventMap>();

    constructor () {
        HookManager.hookFunction('ActivityOrgasmStop', 9, (args, next) => {
            const [C, Progress] = args;
            if (C.IsPlayer()) {
                if (ActivityOrgasmRuined) this.handler.emit('ruined', { Player: C });
                else if (Progress >= 60) this.handler.emit('resisted', { Player: C });
            }
            next(args);
        });

        HookManager.hookFunction('ActivityOrgasmStart', 9, (args, next) => {
            const [C] = args;
            if (C.IsPlayer() && !ActivityOrgasmRuined) this.handler.emit('orgasmed', { Player: C });
            next(args);
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

export const OrgasmEvents = Globals.get('OrgasmEvents', () => new _OrgasmEvents());
