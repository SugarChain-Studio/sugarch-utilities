import { ActivityExtendedEvent, CustomActivity, CustomActivityPrerequisiteItem } from './types';
import { pushHandler } from './handlers';
import { pushLoad, setupLoad } from './load';
import { addActivityEntry, setupEntry } from './entries';
import { addPrerequisite, enlistUnamedPrereq, setupPrereq } from './prereq';
import { addCustomActivity, testCustomActivity } from './stash';
import { addActivityImageMapping, setupDynamicActivityImage } from './image';
import { sleepUntil } from '@sugarch/bc-mod-utility';
import { setLogger } from './logger';
import { ILogger } from '@sugarch/bc-mod-types';
import { addOverrideIfEligible, setupOverride } from './actOverride';

export * from './types';
export { CustomActivity };

export class _ActivityManager<CustomAct extends string = string, CustomPrereq extends string = ActivityPrerequisite> {
    /**
     * Add custom activity prerequisites
     * @param prereqs - Array of custom prerequisites to add
     */
    addPrerequisites (prereqs: CustomActivityPrerequisiteItem<CustomPrereq>[]): void {
        pushLoad(() => prereqs.forEach(p => addPrerequisite(p)));
    }

    /**
     * Check if an activity name is available
     * @param name - Name to check for availability
     * @returns True if the activity name is available
     */
    checkActivityAvailability (name: string): boolean {
        return !ActivityFemale3DCGOrdering.includes(name as ActivityName);
    }

    /**
     * Add a custom activity
     * @param act - Custom activity definition
     */
    addCustomActivity (act: CustomActivity<CustomAct, CustomPrereq> | CustomActivity<CustomAct, CustomPrereq>[]): void {
        if(!Array.isArray(act)) act = [act];
        for(const activity of act) {
            const copyAct = { ...activity };
            pushLoad(() => {
                copyAct.activity.Prerequisite = enlistUnamedPrereq(copyAct.activity.Name, copyAct.activity.Prerequisite);
                copyAct.activity.ActivityID = -1;
    
                ActivityFemale3DCG.push(copyAct.activity as Activity);
                ActivityFemale3DCGOrdering.push(copyAct.activity.Name as ActivityName);
                addActivityEntry(copyAct);
                pushHandler(copyAct.activity.Name, copyAct);
                addCustomActivity(copyAct);
                addOverrideIfEligible(copyAct);
                addActivityImageMapping(copyAct.activity, copyAct.useImage);
            });
        }
    }

    /**
     * Remove a custom activity
     * @param name - Name of the activity to remove
     */
    removeCustomActivity (name: string): void {
        ActivityFemale3DCG = ActivityFemale3DCG.filter(act => act.Name !== name);
        ActivityFemale3DCGOrdering = ActivityFemale3DCGOrdering.filter(act => act !== name);
    }

    /**
     * Check if an activity is custom
     * @param name - Name of the activity to check
     * @returns True if the activity is custom
     */
    activityIsCustom (name: string): boolean {
        return testCustomActivity(name);
    }

    /**
     * Add multiple custom activities
     * @param acts - Array of custom activities to add
     */
    addCustomActivities (acts: CustomActivity<CustomAct, CustomPrereq>[]): void {
        this.addCustomActivity(acts);
    }

    /**
     * Add additional trigger function for an existing activity
     * @param modifier - Activity modifier definition
     */
    activityTrigger (modifier: ActivityExtendedEvent): void {
        pushLoad(() => pushHandler(modifier.name, modifier));
    }

    /**
     * Initialize the activity manager
     */
    init (): void {
        (async () => {
            await sleepUntil(
                () =>
                    Array.isArray(ActivityFemale3DCG) &&
                    ActivityFemale3DCG.length > 0 &&
                    Array.isArray(ActivityFemale3DCGOrdering)
            );
            setupLoad();
        })();
        
        setupOverride();
        setupDynamicActivityImage();
        setupEntry();
        setupPrereq();
    }

    /**
     * Set the logger for the asset manager
     * @param logger
     */
    setLogger (logger: ILogger) {
        setLogger(logger);
    }

    /**
     * Retype ActivityManager, if you need to customize the prerequisite names and ensure
     * type safety, use this method to get a re-typed version
     * @returns retyped ActivityManager
     */
    typePrerequisiteNames<T extends string> () {
        return this as unknown as _ActivityManager<CustomAct, T>;
    }

    /**
     * Retype ActivityManager, if you need to customize the activity names and ensure
     * type safety, use this method to get a re-typed version
     * @returns retyped ActivityManager
     */
    typeActivityNames<T extends string> () {
        return this as unknown as _ActivityManager<T, CustomPrereq>;
    }
}

export type ActivityManagerType<
    CustomAct extends string = string,
    CustomPrereq extends string = ActivityPrerequisite
> = _ActivityManager<CustomAct, CustomPrereq>;

export const ActivityManager = new _ActivityManager();
