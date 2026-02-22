import { HookManager } from '@sugarch/bc-mod-hook-manager';
import type { CustomGroupName, Translation } from '@sugarch/bc-mod-types';
import { TranslationUtility } from '@sugarch/bc-mod-i18n';
import { globalPipeline } from '@sugarch/bc-mod-utility';

interface LayerNameDetails {
    desc: Translation.Entry;
    fallback: string;
    noOverride: boolean;
}

const layerNames = new Map<string, LayerNameDetails>();
const colorGroupNames = new Map<string, LayerNameDetails>();

let layerCache: (() => TextCache) | undefined = undefined;
let colorGroupCache: (() => TextCache) | undefined = undefined;

function combineDetail(target: typeof layerNames, key: string, value: LayerNameDetails) {
    const existing = target.get(key);
    if (!existing) {
        target.set(key, value);
    } else {
        const nDesc = value.noOverride ? { ...value.desc, ...existing.desc } : { ...existing.desc, ...value.desc };
        const nFallback = value.noOverride ? existing.fallback : value.fallback;
        target.set(key, { desc: nDesc, fallback: nFallback, noOverride: value.noOverride });
    }
}

/**
 * Push a layer name into the cache or storage
 * @param key
 * @param desc
 * @param fallback
 * @param noOverride Whether to override existing names
 */
export function pushLayerName(key: string, desc: Translation.Entry, fallback: string, noOverride = false) {
    if (noOverride && layerNames.has(key)) return;
    combineDetail(layerNames, key, { desc, fallback, noOverride });
}

function writeLayerNames(cache: TextCache) {
    layerNames.forEach((value, ckeys) => {
        if (cache.cache[ckeys] && value.noOverride) return;
        cache.cache[ckeys] = TranslationUtility.translateEntry(value.desc, value.fallback);
    });
}

/**
 * Push a color group name into the cache or storage
 * @param key
 * @param desc
 * @param fallback
 * @param noOverride Whether to override existing names
 */
export function pushColorGroupName(key: string, desc: Translation.Entry, fallback: string, noOverride = false) {
    if (noOverride && colorGroupNames.has(key)) return;
    combineDetail(colorGroupNames, key, { desc, fallback, noOverride });
}

function writeColorGroupNames(cache: TextCache) {
    colorGroupNames.forEach((value, ckeys) => {
        if (cache.cache[ckeys] && value.noOverride) return;
        cache.cache[ckeys] = TranslationUtility.translateEntry(value.desc, value.fallback);
    });
}

/**
 * Create a layer name resolver
 * Converts language-layer-name to layer-language-name
 * @param entries
 * @returns A function that resolves layer names
 */
function createLayerNameResolver(entries?: Translation.String) {
    if (!entries) return (layerName: string) => ({ CN: layerName });
    const resolver: Record<string, Translation.Entry> = {};
    for (const [lang, entry] of Object.entries(entries)) {
        for (const [key, value] of Object.entries(entry)) {
            if (!resolver[key]) resolver[key] = {};
            resolver[key][lang as ServerChatRoomLanguage] = value;
        }
    }
    return (layerName: string) => resolver[layerName] || { CN: layerName };
}

/**
 * Transfrom Lang-Layer-String to {key:Layer, entry:Lang-String}[]
 * @param entries Lang-Layer-String entries
 */
function createLayerEntryArray(entries: Translation.CustomRecord<string, string>) {
    const ret: Record<string, Translation.Entry> = {};
    for (const [lang, entry] of Object.entries(entries)) {
        for (const [key, value] of Object.entries(entry)) {
            if (!ret[key]) ret[key] = {};
            ret[key][lang as ServerChatRoomLanguage] = value;
        }
    }
    return Object.entries(ret).reduce(
        (acc, [key, value]) => {
            acc.push({ key, value });
            return acc;
        },
        [] as { key: string; value: Translation.Entry }[]
    );
}

/**
 * Add layer names
 * @param group Body group name
 * @param assetName Asset name
 * @param entries Layer-name, grouped by language
 */
export function addLayerNamesRaw<Custom extends string = AssetGroupBodyName>(
    group: CustomGroupName<Custom>,
    assetName: string,
    entries: Translation.CustomRecord<string, string>
) {
    for (const { key, value } of createLayerEntryArray(entries)) {
        pushLayerName(`${group}${assetName}${key}`, value, key);
    }
}

/**
 * Add color groups names
 * @param group Body group name
 * @param assetName Asset name
 * @param entries ColorGroupName-name, grouped by language
 */
export function addColorGroupNamesRaw<Custom extends string = AssetGroupBodyName>(
    group: CustomGroupName<Custom>,
    assetName: string,
    entries: Translation.CustomRecord<string, string>
) {
    for (const { key, value } of createLayerEntryArray(entries)) {
        pushColorGroupName(`${group}${assetName}${key}`, value, key);
    }
}

/**
 * Add layer names
 * @param group Body group name
 * @param assetDef Item definition
 * @param config
 * @param config.entries Layer-name, grouped by language
 * @param config.noOverride Whether to override existing layer names
 */
export function addLayerNames<Custom extends string = AssetGroupBodyName>(
    group: CustomGroupName<Custom>,
    assetDef: {
        Name: string;
        Layer?: Pick<
            AssetLayerDefinition,
            'Name' | 'ColorGroup' | 'CopyLayerColor' | 'AllowColorize' | 'HideColoring'
        >[];
    },
    {
        entries,
        noOverride,
    }: {
        entries?: Translation.String;
        noOverride?: boolean;
    } = {}
) {
    const resolve = createLayerNameResolver(entries);

    const colorGroupNames = new Set<string>();

    assetDef.Layer?.filter(
        (layer) => !layer.CopyLayerColor && (layer.AllowColorize ?? true) && !layer.HideColoring
    ).forEach(({ Name, ColorGroup }) => {
        if (!Name) {
            pushLayerName(
                `${group}${assetDef.Name}`,
                { CN: assetDef.Name.replace(/_.*?Luzi$/, '') },
                assetDef.Name,
                !!noOverride
            );
        } else pushLayerName(`${group}${assetDef.Name}${Name}`, resolve(Name), Name, !!noOverride);

        if (ColorGroup) colorGroupNames.add(ColorGroup);
    });

    colorGroupNames.forEach((colorGroup) =>
        pushColorGroupName(`${group}${assetDef.Name}${colorGroup}`, resolve(colorGroup), colorGroup, !!noOverride)
    );
}

// Create an async task that waits for ItemColorLayerNames to load and then writes cached layer names to ItemColorLayerNames
export function setupLayerNameLoad() {
    globalPipeline<(layerNames: () => TextCache, groupNames: () => TextCache) => void>(
        'LayerNameInject',
        () => {},
        (pipeline) =>
            HookManager.patchFunction('ItemColorLoad', {
                'ItemColorGroupNames = new TextCache(`Assets/${c.AssetFamily}/ColorGroups.csv`);': `ItemColorGroupNames = new TextCache(\`Assets/\${c.AssetFamily}/ColorGroups.csv\`);${pipeline.globalFuncName}(()=>ItemColorLayerNames, ()=>ItemColorGroupNames);`,
            })
    ).register((_, layerNames, groupNames) => {
        layerCache = layerNames;
        colorGroupCache = groupNames;
    });

    HookManager.hookFunction('ItemColorLoad', 0, (args, next) => {
        const ret = next(args);
        const cacheV = layerCache?.();
        if (cacheV && cacheV.cache) {
            writeLayerNames(cacheV);
        }

        const groupCacheV = colorGroupCache?.();
        if (groupCacheV && groupCacheV.cache) {
            writeColorGroupNames(groupCacheV);
        }
        return ret;
    });
}
