import { HookManager } from '@sugarch/bc-mod-hook-manager';
import { CustomGroupName, Translation } from './types';

interface LayerNameDetails {
    desc: Translation.Entry;
    fallback: string;
    noOverride: boolean;
}

const layerNames = new Map<string, LayerNameDetails>();

let cache: (() => TextCache) | undefined = undefined;

/**
 * Push a layer name into the cache or storage
 * @param key
 * @param desc
 * @param fallback
 * @param noOverride Whether to override existing names
 */
export function pushLayerName (key: string, desc: Translation.Entry, fallback: string, noOverride = false) {
    if (cache?.()?.cache) {
        const lang = TranslationLanguage as ServerChatRoomLanguage;
        if (cache().cache[key] && noOverride) return;
        cache().cache[key] = desc[lang] || desc['CN'] || fallback;
    } else {
        if (noOverride && layerNames.has(key)) return;
        layerNames.set(key, { desc, fallback, noOverride });
    }
}

/**
 * Create a layer name resolver
 * Converts language-layer-name to layer-language-name
 * @param entries
 * @returns A function that resolves layer names
 */
const createLayerNameResolver = (entries?: Translation.CustomRecord<string, string>) => (layerName: string) =>
    Object.entries(entries || { CN: { [layerName]: layerName } })
        .map(([key, value]) => [key, value[layerName] || key] as [ServerChatRoomLanguage, string])
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {} as Partial<Record<ServerChatRoomLanguage, string>>);

/**
 * Add layer names, layer names are obtained directly from entries
 * @param group Body group name
 * @param assetName Item name
 * @param entries Layer-name, grouped by language
 * @param noOverride Whether to override existing layer names
 */
export function addLayerNamesByEntry<Custom extends string = AssetGroupBodyName> (
    group: CustomGroupName<Custom>,
    assetName: string,
    entries: Translation.CustomRecord<string, string>,
    noOverride = true
) {
    const resolve = createLayerNameResolver(entries);
    const layerNames = new Set(
        Object.entries(entries)
            .map(([_, value]) => Object.keys(value))
            .flat()
    );
    layerNames.forEach(layer => {
        pushLayerName(`${group}${assetName}${layer}`, resolve(layer), layer, !!noOverride);
    });
}

/**
 * Add layer names
 * @param group Body group name
 * @param assetDef Item definition
 * @param config
 * @param config.entries Layer-name, grouped by language
 * @param config.noOverride Whether to override existing layer names
 */
export function addLayerNames<Custom extends string = AssetGroupBodyName> (
    group: CustomGroupName<Custom>,
    assetDef: {
        Name: string;
        Layer?: Array<{ Name?: string }>;
    },
    {
        entries,
        noOverride,
    }: {
        entries?: Translation.CustomRecord<string, string>;
        noOverride?: boolean;
    } = {}
) {
    const resolve = createLayerNameResolver(entries);
    assetDef.Layer?.forEach(({ Name }) => {
        if (!Name)
            pushLayerName(
                `${group}${assetDef.Name}`,
                { CN: assetDef.Name.replace(/_.*?Luzi$/, '') },
                assetDef.Name,
                !!noOverride
            );
        else pushLayerName(`${group}${assetDef.Name}${Name}`, resolve(Name), Name, !!noOverride);
    });
}

// Create an async task that waits for ItemColorLayerNames to load and then writes cached layer names to ItemColorLayerNames
export function setupLayerNameLoad () {
    const FuncK = HookManager.randomGlobalFunction('LayerNameInject', (cacheGetter: () => TextCache) => {
        cache = cacheGetter;
    });
    HookManager.patchFunction('ItemColorLoad', {
        'ItemColorLayerNames = new TextCache': `${FuncK}(()=>ItemColorLayerNames);\nItemColorLayerNames = new TextCache`,
    });
    HookManager.progressiveHook('ItemColorLoad', 1)
        .next()
        .inject(() => {
            const cacheV = cache?.()?.cache;
            if (!cacheV) return;
            layerNames.forEach((value, ckeys) => {
                pushLayerName(ckeys, value.desc, value.fallback, value.noOverride);
            });
        });
}
