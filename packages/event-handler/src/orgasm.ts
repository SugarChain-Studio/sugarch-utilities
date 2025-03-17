import { ModManager } from '@sugarch/bc-mod-manager';
import { Globals } from '@sugarch/bc-shared-utility';
import EventEmitter from 'eventemitter3';

// Define types for orgasm events
type OrgasmType = 'orgasmed' | 'ruined' | 'resisted';

// Define custom event emitter interface with our specific events
type OrgasmEventEmitter = EventEmitter<{
    orgasmed: [{ Player: Character }];
    ruined: [{ Player: Character }];
    resisted: [{ Player: Character }];
}>;

// Module's event handler instance
let handler: OrgasmEventEmitter | undefined = undefined;

class _OrgasmEvents {
    constructor () {
        if (handler !== undefined) return;

        handler = new EventEmitter();

        ModManager.hookFunction('ActivityOrgasmStop', 9, (args, next) => {
            const [C, Progress] = args;
            if (C.IsPlayer()) {
                if (ActivityOrgasmRuined) handler!.emit('ruined', { Player: C });
                else if (Progress >= 60) handler!.emit('resisted', { Player: C });
            }
            next(args);
        });

        ModManager.hookFunction('ActivityOrgasmStart', 9, (args, next) => {
            const [C] = args;
            if (C.IsPlayer() && !ActivityOrgasmRuined) handler!.emit('orgasmed', { Player: C });
            next(args);
        });
    }

    /**
     * Register an event listener
     * @param args
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on<T extends OrgasmType> (event: T, listener: (eventData: { Player: Character }) => void, context?: any): void {
        handler!.on(event, listener, context);
    }

    /**
     * Register a one-time event listener
     * @param args
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    once<T extends OrgasmType> (event: T, listener: (eventData: { Player: Character }) => void, context?: any): void {
        handler!.once(event, listener, context);
    }
}

export const OrgasmEvents = Globals.get('OrgasmEvents', () => new _OrgasmEvents());
