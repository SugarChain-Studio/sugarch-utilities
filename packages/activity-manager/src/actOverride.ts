import { HookManager } from "@sugarch/bc-mod-hook-manager";
import { CustomActivity, ExtItemActivity } from "./types";
import { Logger } from "./logger";
import { testCustomActivity } from "./stash";

const overrides: Record<string, Required<CustomActivity<string, string>>["override"]> = {};

const itemProvider: Record<string, Required<CustomActivity<string, string>>["item"]> = {};

const dictProcessing: Record<string, Required<CustomActivity<string, string>>["dictionary"]> = {};

export function addOverrideIfEligible<
    CustomAct extends string = string,
    CustomPrereq extends string = ActivityPrerequisite
>(activity: CustomActivity<CustomAct, CustomPrereq>): void {
    if (activity.override) {
        if (overrides[activity.activity.Name]) {
            Logger.warn(`Override for ${activity.activity.Name} already exists, skipping`);
        }

        if (!overrides[activity.activity.Name]) {
            overrides[activity.activity.Name] = activity.override as Required<
                CustomActivity<string, string>
            >["override"];
        }
    }

    if (activity.item) {
        if (itemProvider[activity.activity.Name]) {
            Logger.warn(`Item provider for ${activity.activity.Name} already exists, skipping`);
        }

        if (!itemProvider[activity.activity.Name]) {
            itemProvider[activity.activity.Name] = activity.item as Required<CustomActivity<string, string>>["item"];
        }
    }

    if (activity.dictionary) {
        if (dictProcessing[activity.activity.Name]) {
            Logger.warn(`Dictionary processor for ${activity.activity.Name} already exists, skipping`);
        }
        if (!dictProcessing[activity.activity.Name]) {
            dictProcessing[activity.activity.Name] = activity.dictionary as Required<
                CustomActivity<string, string>
            >["dictionary"];
        }
    }
}

export function setupOverride() {
    HookManager.hookFunction("ActivityRun", 0, (args, next) => {
        const override = overrides[args[3].Activity.Name];
        if (override) {
            return override(args[0], args[1], args[2], args[3] as unknown as ExtItemActivity<string>);
        }

        const item = itemProvider[args[3].Activity.Name];
        if (item) {
            const itemUsed = item(args[0], args[1], args[2], args[3] as unknown as ExtItemActivity<string>);
            if (itemUsed) {
                args[3].Item = itemUsed;
            }
        }
        return next(args);
    });

    HookManager.hookFunction("PreferenceGetActivityFactor", 0, (args, next) => {
        // always return 2 (liked) for custom activities
        if (testCustomActivity(args[1])) return 2;
        return next(args);
    });

    const insideContext = HookManager.insideFlag("ActivityRun");

    HookManager.hookFunction("ServerSend", 0, (args, next) => {
        if (!insideContext.inside || !insideContext.args) return next(args);
        if (args[0] != "ChatRoomChat") return next(args);
        const cArg = args[1] as ServerChatRoomMessage;

        const prevEntry = cArg.Dictionary as ChatMessageDictionaryEntry[];
        const activity = insideContext.args ? insideContext.args[3].Activity : null;
        if (!activity) return next(args);
        const dictProcessor = dictProcessing[activity.Name];
        if (!dictProcessor) return next(args);
        if (
            !prevEntry.some((entry) => (entry as Partial<ActivityNameDictionaryEntry>)?.ActivityName === activity?.Name)
        )
            return next(args);
        const outerArgs = insideContext.args;
        const newEntries = dictProcessor(
            Array.from(prevEntry),
            outerArgs[0],
            outerArgs[1],
            outerArgs[2],
            outerArgs[3] as unknown as ExtItemActivity<string>
        );
        next([args[0], { ...cArg, Dictionary: newEntries }]);
    });
}
