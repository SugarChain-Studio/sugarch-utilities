import { HookManager } from "@sugarch/bc-mod-hook-manager";
import { CustomActivity, ExtItemActivity } from "./types";
import { Logger } from "./logger";

const overrides: Record<string, Required<CustomActivity<string, string>>["override"]> = {};

export function addOverrideIfEligible<CustomAct extends string = string, CustomPrereq extends string = ActivityPrerequisite>(activity: CustomActivity<CustomAct, CustomPrereq>): void {
    if(overrides[activity.activity.Name]) {
        Logger.warn(`Override for ${activity.activity.Name} already exists, skipping`);
    }

    if(activity.override && !overrides[activity.activity.Name]) {
        overrides[activity.activity.Name] = activity.override as Required<CustomActivity<string, string>>["override"];
    }
}

export function setupOverride() {
    HookManager.hookFunction('ActivityRun', 0, (args, next) => {
        if(overrides[args[0].Name]) {
            const override = overrides[args[0].Name];
            return override(args[0], args[1], args[2], args[3] as unknown as ExtItemActivity<string>);
        }
        return next(args);
    });
}