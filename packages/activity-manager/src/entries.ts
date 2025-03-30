import { HookManager } from '@sugarch/bc-mod-hook-manager';
import { Translation } from '@sugarch/bc-mod-types';
import { CustomActivity } from './types';
import { translateDialog } from './entryUtils';

// Translation entries for each language
const entries: Partial<Record<ServerChatRoomLanguage, Record<string, string>>> = {};

function recordFor<T extends string, U> (record: Partial<Record<T, U>>, callback: (key: T, value: U) => void): void {
    for (const [key, value] of Object.entries(record)) {
        if (value) callback(key as T, value as U);
    }
}

function recordMap<T extends string, U, V, K extends string = T> (
    record: Partial<Record<T, U>>,
    callback: (key: T, value: U) => { key: K; value: V },
    initial: Record<K, V> = {} as Record<K, V>
): Record<K, V> {
    const result: Record<K, V> = { ...initial };
    recordFor(record, (k, v) => {
        const { key, value } = callback(k, v);
        result[key] = value;
    });
    return result;
}

/**
 * Add activity translation entries for grouped targets
 * @param prefix - Prefix for the entry key
 * @param src - Source translation data
 * @param selfOther - Whether the action is on self or other
 * @param activityName - Name of the activity
 */
function addGroupEntry (
    prefix: 'Label-' | '',
    src: Translation.ActivityEntry,
    selfOther: 'Self' | 'Other',
    activityName: string
): void {
    recordFor(src, (lang, groupedEntry) => {
        entries[lang] = recordMap(
            groupedEntry,
            (groupName, entry) => ({
                key: `${prefix}Chat${selfOther}-${groupName}-${activityName}`,
                value: entry,
            }),
            entries[lang] || {}
        );
    });
}

// Mapping of alternative asset group names
const AlterNames: Partial<Record<AssetGroupItemName, string>> = {
    ItemVulva: 'ItemPenis',
    ItemVulvaPiercings: 'ItemGlans',
};

/**
 * Add simple activity translation entries
 * @param prefix - Prefix for the entry key
 * @param src - Source translation data
 * @param selfOther - Whether the action is on self or other
 * @param activityName - Name of the activity
 * @param groups - Target asset groups
 */
function addSimpleEntry (
    prefix: 'Label-' | '',
    src: Translation.Entry,
    selfOther: 'Self' | 'Other',
    activityName: string,
    groups: AssetGroupItemName[]
): void {
    recordFor(src, (lang, entry) => {
        if (!entries[lang]) entries[lang] = {};
        for (const groupName of groups) {
            // Process each group and its potential alternative name
            entries[lang][`${prefix}Chat${selfOther}-${groupName}-${activityName}`] = entry;
            const altName = AlterNames[groupName];
            if (altName) {
                entries[lang][`${prefix}Chat${selfOther}-${altName}-${activityName}`] = entry;
            }
        }
    });
}

/**
 * Add translation entries based on their type
 * @param prefix - Prefix for the entry key
 * @param src - Source translation data
 * @param selfOther - Whether the action is on self or other
 * @param activityName - Name of the activity
 * @param groups - Target asset groups
 */
function addEntryBranch (
    prefix: 'Label-' | '',
    src: Translation.ActivityEntry | Translation.Entry,
    selfOther: 'Self' | 'Other',
    activityName: string,
    groups: AssetGroupItemName[]
): void {
    if (isTranslationEntry(src)) {
        addSimpleEntry(prefix, src, selfOther, activityName, groups);
    } else {
        addGroupEntry(prefix, src, selfOther, activityName);
    }
}

/**
 * Check if the source is a simple translation entry
 * @param src - Source translation data
 * @returns True if it's a simple translation entry
 */
function isTranslationEntry (src: Translation.ActivityEntry | Translation.Entry): src is Translation.Entry {
    return Object.values(src).some(v => typeof v === 'string');
}
/**
 * Add activity translation entries
 * @param src - Custom activity definition
 */
export function addActivityEntry<CustomAct extends string = string, CustomPrereq extends string = ActivityPrerequisite> (
    src: CustomActivity<CustomAct, CustomPrereq>
): void {
    const { activity, label, labelSelf, dialog, dialogSelf } = src;
    const { Name, Target, TargetSelf } = activity;

    const dlabel = label ?? labelSelf ?? { CN: Name };

    if (isTranslationEntry(dlabel)) {
        recordFor(dlabel, (lang, entry) => {
            if (!entries[lang]) entries[lang] = {};
            entries[lang][`Activity${Name}`] = entry;
        });
    } else {
        recordFor(dlabel, (lang, entry) => {
            if (!entries[lang]) entries[lang] = {};
            entries[lang][`Activity${Name}`] = Object.values(entry)[0] || Name;
        });
    }

    addEntryBranch('Label-', dlabel, 'Other', Name, Target);
    if (dialog) addEntryBranch('', dialog, 'Other', Name, Target);

    const tGroups = (() => {
        if (typeof TargetSelf === 'boolean' && TargetSelf) return Target;
        if (Array.isArray(TargetSelf)) return TargetSelf;
        return [];
    })();

    const nlabel = labelSelf || label;
    if (nlabel) addEntryBranch('Label-', nlabel, 'Self', Name, tGroups);
    const ndialog = dialogSelf || dialog;
    if (ndialog) addEntryBranch('', ndialog, 'Self', Name, tGroups);
}

/**
 * Set up translation hooks
 */
export function setupEntry (): void {
    const resolve = (tag: string): string | undefined => translateDialog(entries, tag);

    HookManager.hookFunction('ActivityDictionaryText', 1, (args, next) => resolve(args[0]) || next(args));

    HookManager.progressiveHook('ServerSend', 1)
        .inside('ActivityRun')
        .inject(args => {
            const { Content, Dictionary, Type } = args[1] as Parameters<ClientToServerEvents['ChatRoomChat']>[0];
            if (Type !== 'Activity' || !Dictionary) return;
            const Text = resolve(Content);
            if (Text) Dictionary.push({ Tag: `MISSING ACTIVITY DESCRIPTION FOR KEYWORD ${Content}`, Text });
        });
}
