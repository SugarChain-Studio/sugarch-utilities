import { HookManager } from '@sugarch/bc-mod-hook-manager';
import { checkItemCustomed, getCustomAssets, getCustomGroups } from './customStash';
import { getCustomMirrorGroups, resolvePreimage } from './mirrorGroup';
import type { CustomGroupName, Translation } from '@sugarch/bc-mod-types';
import { TranslationUtility } from '@sugarch/bc-mod-i18n';
import { globalPipeline } from '@sugarch/bc-mod-utility';

/**
 * Resolve translation entry by language
 * @param entryItem
 */
export function resolveEntry(entryItem: Translation.Entry): string {
    return TranslationUtility.translateEntry(entryItem, entryItem['CN']);
}

/**
 * Resolve translation entry by language with solid CN fallback
 * @param entryItem
 * @param fallback
 */
export function solidfyEntry(entryItem: Translation.Entry | undefined, fallback: string): Translation.SolidEntry {
    if (!entryItem) return { CN: fallback };
    if (entryItem['CN']) return entryItem as Translation.SolidEntry;
    return { ...entryItem, CN: fallback };
}

/**
 * Lang-Group-Asset-Layer-String
 * Lang-Layer-String
 * @param group
 * @param asset
 * @param groupedEntry
 */
export function pickStrings<Custom extends string = AssetGroupBodyName>(
    group: CustomGroupName<Custom>,
    asset: string,
    groupedLayerNames: Translation.GroupedAssetStrings<Custom>
): Translation.String {
    const ret: Translation.String = {};
    for (const [lang, entries] of Object.entries(groupedLayerNames)) {
        if (entries[group]?.[asset]) ret[lang as ServerChatRoomLanguage] = entries[group][asset];
    }
    return ret;
}

/**
 * Pick needed entries from a collection of grouped entries
 * @param group
 * @param asset
 * @param groupedEntry
 */
export function pickEntry<Custom extends string = AssetGroupBodyName>(
    group: CustomGroupName<Custom>,
    asset: string,
    groupedEntry: Translation.GroupedEntries
): Translation.Entry {
    const ret: Translation.Entry = {};
    for (const [lang, entries] of Object.entries(groupedEntry)) {
        if (entries[group]?.[asset]) ret[lang as ServerChatRoomLanguage] = entries[group][asset];
    }
    return ret;
}

const customAssetEntries: Partial<Record<ServerChatRoomLanguage, Record<string, Record<string, string>>>> = {};
const customGroupEntries: Translation.CustomRecord<string, string> = {};

export class Entries {
    /**
     * Set item name (display name)
     * @param group
     * @param asset
     * @param entries
     */
    static setAsset<Custom extends string = AssetGroupBodyName>(
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
     * Set body group name (display name)
     * @param group
     * @param entries
     */
    static setGroup<Custom extends string = AssetGroupBodyName>(
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
function assetEntryString<Custom extends string = AssetGroupBodyName>(
    group: CustomGroupName<Custom>,
    asset: string
): string {
    return TranslationUtility.translateGroupedEntries(
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
function groupEntryString<Custom extends string = AssetGroupBodyName>(group: CustomGroupName<Custom>): string {
    return TranslationUtility.translateString(
        customGroupEntries as Translation.String,
        group,
        group.replace(/_.*?Luzi$/, '')
    );
}

/**
 * Assign a description (display name) to an object
 * @param obj
 * @param desc
 */
function assignDesc(obj: { Description: string }, desc: string): void {
    obj.Description = desc;
}

function loadAssetEntries(): void {
    // Custom group names
    Object.values(getCustomGroups()).forEach((group) => assignDesc(group, groupEntryString(group.Name)));

    // Custom item names
    Object.values(getCustomAssets())
        .map((asset) => Object.values(asset))
        .flat()
        .forEach((asset) => assignDesc(asset, assetEntryString(asset.Group.Name, asset.Name)));

    // Mirror group names
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
        const names = AssetGroup.map((group) => group.Name).sort((a, b) => b.length - a.length);
        Object.entries(tcache.cache).forEach(([key, value]) => {
            if (doneSet.has(key)) return;
            const n = names.find((name) => key.startsWith(name));
            if (!n) return;
            doneSet.add(key);
            const mirrors = cmg[n];
            if (!mirrors) return;
            const tail = key.slice(n.length);

            mirrors.forEach((mirror) => {
                const mirrorKey = mirror + tail;
                if (!tcache.cache[mirrorKey]) tcache.cache[mirrorKey] = value;
            });
        });
    };
    if (assetStrings) {
        if (!assetStrings.loaded) {
            assetStrings.rebuildListeners.push((tcache) => tcache && loadFunc(tcache));
        } else {
            loadFunc(assetStrings);
        }
    }
}

let entriesLoaded = false;
export function setupEntries(): void {
    if (entriesLoaded) return;
    entriesLoaded = true;

    // BC has three loading phases:
    // Phase 1: Load assets
    // Phase 2: Load CSV descriptions (display names)
    // Phase 3: Load translations (not always performed)
    // To ensure correct translations, we need to reload names after phases 2 and 3

    const assetCache = TextAllScreenCache.get(AssetStringsPath);

    if (assetCache && assetCache.loaded && (TranslationLanguage === 'EN' || assetCache.get('Bloated') !== 'Bloated')) {
        // Already loaded, directly load names
        loadAssetEntries();
    }

    // Load CSV descriptions (display names)
    HookManager.progressiveHook('AssetBuildDescription').next().inject(loadAssetEntries);
    // Translation loading phase
    HookManager.progressiveHook('TranslationAssetProcess').next().inject(loadAssetEntries);

    globalPipeline<(dictionary: DictionaryBuilder, PrevItem: Item, NextItem: Item) => void>(
        'CustomDialogInject',
        () => {},
        (pipeline) =>
            HookManager.patchFunction('ChatRoomPublishAction', {
                'ChatRoomCharacterItemUpdate(': `${pipeline.globalFuncName}(dictionary, PrevItem, NextItem);\nChatRoomCharacterItemUpdate(`,
            })
    ).register((_, dictionary, PrevItem, NextItem) => {
        for (const [key, item] of [
            ['PrevAsset', PrevItem],
            ['NextAsset', NextItem],
        ] as const) {
            const customed = checkItemCustomed(item);
            // Add an extra 'text' tag here in order to display the name or craft name of plugin items to clients without the plugin.
            // Without this tag, or if using the asset tag, the item name will display incorrectly (as 'NextAsset' or 'PrevAsset') for users without the plugin.
            if (customed)
                dictionary.text(
                    key,
                    item.Craft ? `${item.Craft.Name} (${item.Asset.Description})` : item.Asset.Description
                );
        }
    });
}
