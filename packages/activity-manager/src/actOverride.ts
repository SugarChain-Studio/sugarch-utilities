import { HookManager } from "@sugarch/bc-mod-hook-manager";
import { CustomActivity, ExtItemActivity } from "./types";
import { Logger } from "./logger";

const overrides: Record<string, Required<CustomActivity<string, string>>["override"]> = {};

const itemProvider: Record<string, Required<CustomActivity<string, string>>["item"]> = {};

export function addOverrideIfEligible<CustomAct extends string = string, CustomPrereq extends string = ActivityPrerequisite>(activity: CustomActivity<CustomAct, CustomPrereq>): void {
    if(activity.override) {
        if(overrides[activity.activity.Name]) {
            Logger.warn(`Override for ${activity.activity.Name} already exists, skipping`);
        }
    
        if(!overrides[activity.activity.Name]) {
            overrides[activity.activity.Name] = activity.override as Required<CustomActivity<string, string>>["override"];
        }
    }

    if(activity.item) {
        if(itemProvider[activity.activity.Name]) {
            Logger.warn(`Item provider for ${activity.activity.Name} already exists, skipping`);
        }

        if(!itemProvider[activity.activity.Name]) {
            itemProvider[activity.activity.Name] = activity.item as Required<CustomActivity<string, string>>["item"];
        }
    }
}

export function setupOverride() {
    HookManager.hookFunction('ActivityRun', 0, (args, next) => {
        const override = overrides[args[3].Activity.Name];
        if(override) {
            return override(args[0], args[1], args[2], args[3] as unknown as ExtItemActivity<string>);
        }

        const item = itemProvider[args[3].Activity.Name];
        if(item) {
            const itemUsed = item(args[0], args[1], args[2], args[3] as unknown as ExtItemActivity<string>);
            if(itemUsed) {
                args[3].Item = itemUsed;
            }
        }

        return next(args);
    });
}