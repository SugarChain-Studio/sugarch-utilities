import { Logger } from './logger';
import { ActivityRunnable } from './types';
import { ActivityEvents } from '@sugarch/bc-event-handler';

const deRepeats = new Set<string>();

/**
 * Register an activity handler for a specific activity
 * @param name - Name of the activity
 * @param handler - Handler to execute when the activity occurs
 */
export function pushHandler (name: string, handler: ActivityRunnable): void {
    if (deRepeats.has(name)) {
        Logger.warn(`Handler for ${name} already exists, skipping`);
        return;
    }

    ActivityEvents.on(handler.mode ?? 'SelfInvolved', name as ActivityName, (sender, player, info) => {
        handler.run?.(player, sender, info);
    });
}
