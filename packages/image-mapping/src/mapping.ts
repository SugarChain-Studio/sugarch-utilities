import { Globals } from '@sugarch/bc-mod-utility';
import { HookManager } from '@sugarch/bc-mod-hook-manager';
import { sleepUntil, PathTools } from '@sugarch/bc-mod-utility';
import { ImageMappingStorage } from './mappingStorage';
import type { AssetOverrideContainer, ImageMappingRecord } from "@sugarch/bc-mod-types";

const storage = new ImageMappingStorage();

/**
 * Resolve compressed asset overrides, returning a mapping of asset paths to URLs
 * The `overrides` object should be a nested object where the keys are asset paths and the values are version strings, e.g.
 * ```jsonc
 * {
 *   "Assets": {
 *     "Female3DCG": {
 *       "ItemMisc": {
 *         // use semver as version string
 *         "Key.png": "1.0.0",
 *         // use git hash as version string
 *         "Key2.png": "acbd18db"
 *       }
 *     }
 *   }
 * }
 * ```
 * @param baseURL The base URL to prepend to all asset paths
 * @param overrides The compressed asset overrides
 * @returns A mapping of asset paths to URLs
 */
export async function resolveAssetOverrides (
    baseURL: string,
    overrides: AssetOverrideContainer
): Promise<ImageMappingRecord> {
    const basicImgMapping: ImageMappingRecord = {};

    const processList: { container: AssetOverrideContainer; path: string }[] = [{ container: overrides, path: '' }];

    while (processList.length > 0) {
        const current = processList.pop()!;
        Object.entries(current.container).forEach(([key, value]) => {
            const assetPath = `${current.path}${key}`;
            if (typeof value !== 'object') {
                basicImgMapping[assetPath] = `${baseURL}${assetPath}?v=${value}`;
            } else {
                processList.push({ container: value as AssetOverrideContainer, path: `${assetPath}/` });
            }
        });
    }
    return basicImgMapping;
}

function setupImgMapping (): void {
    // Cross-origin image loading
    HookManager.patchFunction('GLDrawLoadImage', {
        'Img.src = url;': 'Img.crossOrigin = "Anonymous";\n\t\tImg.src = url;',
    });

    (['DrawImageEx', 'DrawImageResize', 'GLDrawImage', 'DrawGetImage'] as const).forEach(fn => {
        HookManager.hookFunction(fn, 0, (args, next) => {
            args[0] = storage.mapImgSrc(args[0]);
            return next(args);
        });
    });

    (async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await sleepUntil(() => (globalThis as any)['ElementButton'] !== undefined);

        HookManager.hookFunction('ElementButton.CreateForAsset', 0, (args, next) => {
            storage.mapImg(PathTools.assetPreviewIconPath(args[1] as Asset | Item), (image: string) => {
                args[4] = { ...args[4], image };
            });
            return next(args);
        });

        HookManager.hookFunction('ElementButton.CreateForActivity', 0, (args, next) => {
            const activity = args[1] as ItemActivity;
            const srcImage = activity.Item
                ? PathTools.assetPreviewIconPath(activity.Item.Asset)
                : `Assets/Female3DCG/Activity/${activity.Activity.Name}.png`;
            storage.mapImg(srcImage, (image: string) => {
                args[4] = { ...args[4], image };
            });

            return next(args);
        });

        const func = HookManager.randomGlobalFunction<[string], string>(
            'mapImage',
            src => storage.mapImgSrc(src) as string
        );

        HookManager.patchFunction('ElementButton._ParseIcons', {
            'src = `./Assets/Female3DCG/ItemMisc/Preview/${icon}.png`': `src = ${func}(\`./Assets/Female3DCG/ItemMisc/Preview/\${icon}.png\`)`,
        });
    })();
}

class _ImageMapping {
    constructor () {
        setupImgMapping();
    }

    /**
     * Add custom image mappings, **will** override existing mappings
     * @param mappings
     */
    addImgMapping (mappings: Record<string, string>): void {
        storage.addImgMapping(mappings);
    }

    /**
     * Set basic image mappings, **will not** override existing mappings
     * @param mappings
     */
    setBasicImgMapping (mappings: Record<string, string>): void {
        storage.setBasicImgMapping(mappings);
    }
}

export const ImageMapping = Globals.get('ImageMapping', () => new _ImageMapping());
