import { HookManager } from '@sugarch/bc-mod-hook-manager';
import type { CustomGroupName, Translation } from '@sugarch/bc-mod-types';
import { translateEntry } from './entryUtils';
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

/**
 * Push a layer name into the cache or storage
 * @param key
 * @param desc
 * @param fallback
 * @param noOverride Whether to override existing names
 */
export function pushLayerName (key: string, desc: Translation.Entry, fallback: string, noOverride = false) {
    if (noOverride && layerNames.has(key)) return;
    layerNames.set(key, { desc, fallback, noOverride });
}

function writeLayerNames (cache: TextCache) {
    layerNames.forEach((value, ckeys) => {
        if (cache.cache[ckeys] && value.noOverride) return;
        cache.cache[ckeys] = translateEntry(value.desc, value.fallback);
    });
}

/**
 * Push a color group name into the cache or storage
 * @param key
 * @param desc
 * @param fallback
 * @param noOverride Whether to override existing names
 */
export function pushColorGroupName (key: string, desc: Translation.Entry, fallback: string, noOverride = false) {
    if (noOverride && colorGroupNames.has(key)) return;
    colorGroupNames.set(key, { desc, fallback, noOverride });
}

function writeColorGroupNames (cache: TextCache) {
    colorGroupNames.forEach((value, ckeys) => {
        if (cache.cache[ckeys] && value.noOverride) return;
        cache.cache[ckeys] = translateEntry(value.desc, value.fallback);
    });
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
        Layer?: Pick<AssetLayerDefinition, 'Name' | 'ColorGroup'>[];
    },
    {
        entries,
        noOverride,
    }: {
        entries?: Translation.Dialog;
        noOverride?: boolean;
    } = {}
) {
    const resolve = createLayerNameResolver(entries);
    assetDef.Layer?.forEach(({ Name, ColorGroup }) => {
        if (!Name) {
            pushLayerName(
                `${group}${assetDef.Name}`,
                { CN: assetDef.Name.replace(/_.*?Luzi$/, '') },
                assetDef.Name,
                !!noOverride
            );
        } else pushLayerName(`${group}${assetDef.Name}${Name}`, resolve(Name), Name, !!noOverride);

        if (ColorGroup) {
            pushColorGroupName(`${group}${assetDef.Name}${ColorGroup}`, resolve(ColorGroup), ColorGroup, false);
        }
    });
}

// Create an async task that waits for ItemColorLayerNames to load and then writes cached layer names to ItemColorLayerNames
export function setupLayerNameLoad () {
    globalPipeline<(layerNames: () => TextCache, groupNames: () => TextCache) => void>(
        'LayerNameInject',
        () => {},
        pipeline =>
            HookManager.patchFunction('ItemColorLoad', {
                'ItemColorGroupNames = new TextCache(`Assets/${c.AssetFamily}/ColorGroups.csv`);': `ItemColorGroupNames = new TextCache(\`Assets/\${c.AssetFamily}/ColorGroups.csv\`);${pipeline.globalFuncName}(()=>ItemColorLayerNames, ()=>ItemColorGroupNames);`,
            })
    ).register((_, layerNames, groupNames) => {
        layerCache = layerNames;
        colorGroupCache = groupNames;
    });

    HookManager.progressiveHook('ItemColorLoad', 1)
        .next()
        .inject(() => {
            const cacheV = layerCache?.();
            if (cacheV && cacheV.cache) {
                writeLayerNames(cacheV);
            }

            const groupCacheV = colorGroupCache?.();
            if (groupCacheV && groupCacheV.cache) {
                writeColorGroupNames(groupCacheV);
            }
        });
}
