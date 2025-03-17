import { ModManager } from '@sugarch/bc-mod-manager';
import { checkItemCustomed, getCustomAssets, getCustomGroups } from './customStash';
import { getCustomMirrorGroups, resolvePreimage } from './mirrorGroup';
import { CustomGroupName, Translation } from './types';
import { translateDialog, translateEntry, translateGroupedEntries } from './entryUtils';

/**
 * Resolve translation entry by language
 * @param entryItem
 */
export function resolveEntry (entryItem: Translation.Entry): string {
    return translateEntry(entryItem, entryItem['CN']);
}

/**
 * Resolve translation entry by language with solid CN fallback
 * @param entryItem
 * @param fallback
 */
export function solidfyEntry (entryItem: Translation.Entry | undefined, fallback: string): Translation.SolidEntry {
    if (!entryItem) return { CN: fallback };
    if (entryItem['CN']) return entryItem as Translation.SolidEntry;
    return { ...entryItem, CN: fallback };
}

/**
 * Pick needed entries from a collection of grouped entries
 * @param group
 * @param asset
 * @param groupedEntry
 */
export function pickEntry<Custom extends string = AssetGroupBodyName> (
    group: CustomGroupName<Custom>,
    asset: string,
    groupedEntry: Translation.GroupedEntries
): Translation.Entry {
    let ret: Translation.Entry = {};
    for (const [lang, entries] of Object.entries(groupedEntry)) {
        if (entries[group]?.[asset]) ret[lang as ServerChatRoomLanguage] = entries[group][asset];
    }
    return ret;
}

const customAssetEntries: Partial<Record<ServerChatRoomLanguage, Record<string, Record<string, string>>>> = {};
const customGroupEntries: Translation.CustomRecord<string, string> = {};

export class Entries {
    /**
     * Set item description (display name)
     * @param group
     * @param asset
     * @param entries
     */
    static setAsset<Custom extends string = AssetGroupBodyName> (
        group: CustomGroupName<Custom>,
        asset: string,
        entries: Translation.Entry
    ): void {
        Object.entries(entries).forEach(([lang, desc]) => {
            const language = lang as ServerChatRoomLanguage;
            if (!customAssetEntries[language]) customAssetEntries[language] = {};
            if (!customAssetEntries[language][group]) customAssetEntries[language][group] = {};
            customAssetEntries[language][group][asset] = desc;
        });
    }

    /**
     * Set body group description (display name)
     * @param group
     * @param entries
     */
    static setGroup<Custom extends string = AssetGroupBodyName> (
        group: CustomGroupName<Custom>,
        entries: Translation.Entry
    ): void {
        Object.entries(entries).forEach(([lang, desc]) => {
            const language = lang as ServerChatRoomLanguage;
            if (!customGroupEntries[language]) customGroupEntries[language] = {};
            customGroupEntries[language][group] = desc;
        });
    }
}

/**
 * Get asset entry string for the current language
 * @param group
 * @param asset
 */
function assetEntryString<Custom extends string = AssetGroupBodyName> (
    group: CustomGroupName<Custom>,
    asset: string
): string {
    return translateGroupedEntries(
        customAssetEntries as Translation.GroupedEntries<Custom>,
        group,
        asset,
        asset.replace(/_.*?Luzi$/, '')
    );
}

/**
 * Get group entry string for the current language
 * @param group
 */
function groupEntryString<Custom extends string = AssetGroupBodyName> (group: CustomGroupName<Custom>): string {
    return translateDialog(customGroupEntries as Translation.Dialog, group, group.replace(/_.*?Luzi$/, ''));
}

/**
 * Assign a description to an object
 * @param obj
 * @param desc
 */
function assignDesc (obj: { Description: string }, desc: string): void {
    obj.Description = desc;
}

function loadAssetEntries (): void {
    // Custom group descriptions
    Object.values(getCustomGroups()).forEach(group => assignDesc(group, groupEntryString(group.Name)));

    // Custom item descriptions
    Object.values(getCustomAssets())
        .map(asset => Object.values(asset))
        .flat()
        .forEach(asset => assignDesc(asset, assetEntryString(asset.Group.Name, asset.Name)));

    // Mirror group descriptions
    Object.entries(getCustomAssets())
        .map(([group, asset]) => ({
            group: resolvePreimage(group as CustomGroupName),
            asset,
        }))
        .filter(({ group }) => !!group)
        .map(({ group, asset }) =>
            Object.entries(asset).map(([assetName, asset]) => ({
                asset,
                fromAsset: AssetGet('Female3DCG', group as AssetGroupName, assetName),
            }))
        )
        .flat()
        .filter(({ fromAsset }) => !!fromAsset)
        .forEach(({ asset, fromAsset }) => assignDesc(asset, (fromAsset as Asset).Description));

    const assetStrings: TextCache | undefined = TextAllScreenCache.get(AssetStringsPath);
    const loadFunc = (tcache: TextCache) => {
        const cmg = getCustomMirrorGroups();
        const doneSet = new Set<string>();
        const names = AssetGroup.map(group => group.Name).sort((a, b) => b.length - a.length);
        Object.entries(tcache.cache).forEach(([key, value]) => {
            if (doneSet.has(key)) return;
            const n = names.find(name => key.startsWith(name));
            if (!n) return;
            doneSet.add(key);
            const mirrors = cmg[n];
            if (!mirrors) return;
            const tail = key.slice(n.length);

            mirrors.forEach(mirror => {
                const mirrorKey = mirror + tail;
                if (!tcache.cache[mirrorKey]) tcache.cache[mirrorKey] = value;
            });
        });
    };
    if (assetStrings) {
        if (!assetStrings.loaded) {
            assetStrings.rebuildListeners.push(tcache => tcache && loadFunc(tcache));
        } else {
            loadFunc(assetStrings);
        }
    }
}

export function setupEntries (): void {
    // BC has three loading phases:
    // Phase 1: Load assets
    // Phase 2: Load CSV descriptions
    // Phase 3: Load translations (not always performed)
    // To ensure correct translations, we need to reload descriptions after phases 2 and 3

    const assetCache = TextAllScreenCache.get(AssetStringsPath);

    if (assetCache && assetCache.loaded && (TranslationLanguage === 'EN' || assetCache.get('Bloated') !== 'Bloated')) {
        // Already loaded, directly load descriptions
        loadAssetEntries();
    } else {
        // Load CSV descriptions
        ModManager.progressiveHook('AssetBuildDescription').next().inject(loadAssetEntries);
        // Translation loading phase
        ModManager.progressiveHook('TranslationAssetProcess').next().inject(loadAssetEntries);
    }

    const ActionFunc = ModManager.randomGlobalFunction(
        'CustomDialogInject',
        (dictionary: any, _1: any, _2: any, PrevItem: any, NextItem: any) => {
            [
                ['PrevAsset', PrevItem],
                ['NextAsset', NextItem],
            ]
                .map(([key, value]) => [key, value, checkItemCustomed(value)])
                .forEach(([key, item, customed]) => {
                    if (customed) dictionary.text(key, item.Asset.Description);
                });
        }
    );

    ModManager.patchFunction('ChatRoomPublishAction', {
        'ChatRoomCharacterItemUpdate(C);': `${ActionFunc}(dictionary, C, Action, PrevItem, NextItem);\nChatRoomCharacterItemUpdate(C);`,
    });
}
