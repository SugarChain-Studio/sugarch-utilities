import { sleepUntil } from './sleep';
import { ModManager } from '@sugarch/bc-mod-manager';
import { Paths } from './paths';
import { ImageMappingStorage } from './mappingStorage';
import { AssetOverrideContainer, ImageMappingRecord } from './types';
import { Globals } from './globals';

const storage = new ImageMappingStorage();

export async function resolveAssetOverrides (
    baseURL: string,
    overrides: AssetOverrideContainer
): Promise<ImageMappingRecord> {
    const basicImgMapping: ImageMappingRecord = {};

    let processList: { container: AssetOverrideContainer; path: string }[] = [{ container: overrides, path: '' }];

    while (processList.length > 0) {
        let current = processList.pop()!;
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
    ModManager.patchFunction('GLDrawLoadImage', {
        'Img.src = url;': 'Img.crossOrigin = "Anonymous";\n\t\tImg.src = url;',
    });

    (['DrawImageEx', 'DrawImageResize', 'GLDrawImage', 'DrawGetImage'] as const).forEach(fn => {
        ModManager.hookFunction(fn, 0, (args, next) => {
            args[0] = storage.mapImgSrc(args[0]);
            return next(args);
        });
    });

    (async () => {
        await sleepUntil(() => (globalThis as any)['ElementButton'] !== undefined);

        ModManager.hookFunction('ElementButton.CreateForAsset', 0, (args, next) => {
            const _args = args as any[];
            storage.mapImg(Paths.AssetPreviewIconPath(_args[1] as Asset | Item), (image: string) => {
                _args[4] = { ..._args[4], image };
            });
            return next(args);
        });

        ModManager.hookFunction('ElementButton.CreateForActivity', 0, (args, next) => {
            const _args = args as any[];
            const activity = _args[1] as ItemActivity;

            const srcImage = activity.Item
                ? Paths.AssetPreviewIconPath(activity.Item.Asset)
                : `Assets/Female3DCG/Activity/${activity.Activity.Name}.png`;
            storage.mapImg(srcImage, (image: string) => {
                _args[4] = { ..._args[4], image };
            });

            return next(args);
        });

        const func = ModManager.randomGlobalFunction<[string], string>(
            'mapImage',
            src => storage.mapImgSrc(src) as string
        );

        ModManager.patchFunction('ElementButton._ParseIcons', {
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
