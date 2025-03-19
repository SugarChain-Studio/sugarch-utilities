import { HookManager } from '@sugarch/bc-mod-hook-manager';
import { CustomActivityPrerequisite, CustomActivityPrerequisiteItem, ExCustomActivityPrerequisite } from './types';

export type AnyPrerequisite = string;

/**
 * Map of custom prerequisites by name
 */
const prereqMap: Record<AnyPrerequisite, CustomActivityPrerequisiteItem<AnyPrerequisite>> = {};

/**
 * Add a custom prerequisite to the registry
 * @param prereq - The custom prerequisite to add
 */
export function addPrerequisite<Custom extends string = ActivityPrerequisite> (
    prereq: CustomActivityPrerequisiteItem<Custom>
): void {
    prereqMap[prereq.name] = prereq;
}

/**
 * Set up the prerequisite hook for activity checks
 */
export function setupPrereq (): void {
    HookManager.hookFunction('ActivityCheckPrerequisite', 1, (args, next) => {
        const cusPrereq = prereqMap[args[0]];
        if (cusPrereq) return cusPrereq.test(...args);
        return next(args);
    });
}

/**
 * Generate a random, unique prerequisite key
 * @param prefix - String prefix for the key
 * @returns A unique prerequisite key
 */
function randomPrereqKey (prefix: string): AnyPrerequisite {
    while (true) {
        const key = `${prefix}_prereq_${Math.random().toString(36).substring(2)}`;
        if (!prereqMap[key]) return key as AnyPrerequisite;
    }
}

/**
 * Convert unnamed function prerequisites to named prerequisites
 * @param actName - Activity name used for generating keys
 * @param prereq - Array of prerequisites (functions or names)
 * @returns Array of named prerequisites
 */
export function enlistUnamedPrereq<CustomPrereq extends string = ActivityPrerequisite> (
    actName: string,
    prereq: ExCustomActivityPrerequisite<CustomPrereq>[]
): CustomActivityPrerequisite<CustomPrereq>[] {
    return prereq.map(p => {
        if (typeof p === 'function') {
            const name = randomPrereqKey(actName);
            addPrerequisite({ name, test: p });
            return name;
        }
        return p;
    }) as CustomActivityPrerequisite<CustomPrereq>[];
}
