import { Globals, once } from '@sugarch/bc-mod-utility';
import { HookManager } from '@sugarch/bc-mod-hook-manager';
import { sleepUntil, PathTools } from '@sugarch/bc-mod-utility';
import { ImageMappingStorage } from './mappingStorage';
import { version } from './package';
import { VirtualPath } from './virtualPath';

const storage = new ImageMappingStorage();

function setupImgMapping (): void {
    once('ImgMappingOnce.GLDrawLoadImage.crossOrigin', () => {
        // Cross-origin image loading
        HookManager.patchFunction('GLDrawLoadImage', {
            '\tImg.src = url;': '\tImg.crossOrigin = "Anonymous";\n\t\t\tImg.src = url;',
            '\ttmpImg.src = url;': '\ttmpImg.crossOrigin = "Anonymous";\n\t\t\ttmpImg.src = url;',
        });
    });

    (['DrawImageEx', 'DrawImageResize', 'GLDrawImage', 'DrawGetImage'] as const).forEach(fn => {
        HookManager.hookFunction(fn, 10, (args, next) => {
            args[0] = storage.mapImgSrc(args[0]);
            return next(args);
        });
    });

    once('ImgMappingOnce.nomap', () => {
        (['DrawImageEx', 'DrawImageResize', 'GLDrawImage', 'DrawGetImage'] as const).forEach(fn => {
            HookManager.hookFunction(fn, 0, (args, next) => {
                if (typeof args[0] === 'string' && args[0].startsWith('@nomap/')) {
                    args[0] = args[0].substring(7);
                }
                return next(args);
            });
        });
    });

    // R133+: the game keeps the images of shown characters cached by re-touching the URLs
    // in C.DrawnAssets, but records them before the hooks above remap them. A remapped
    // image is then never touched, gets purged while still worn, and the next rebuild of
    // that character draws without it. Record the remapped URL as well.
    // "@nomap/" only tells the draw hooks above not to remap, so record the plain path
    // instead; otherwise the cache fetches "@nomap/Assets/..." from the server and 404s.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (globalThis as any)['CommonDrawMarkDrawnAsset'] === 'function') {
        HookManager.hookFunction('CommonDrawMarkDrawnAsset', 0, (args, next) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const [C, src] = args as unknown as [any, unknown];
            if (typeof src === 'string' && src.startsWith('@nomap/')) {
                (args as unknown as unknown[])[1] = src.substring(7);
                return next(args);
            }
            const ret = next(args);
            if (typeof src === 'string' && C?.DrawnAssets instanceof Set) {
                let drawn = storage.mapImgSrc(src);
                if (drawn.startsWith('@nomap/')) drawn = drawn.substring(7);
                if (drawn !== src) C.DrawnAssets.add(drawn);
            }
            return ret;
        });
    }

    HookManager.hookFunction('GLDrawLoadTextureAlphaMask', 0, (args, next) => {
        if (Array.isArray(args[5])) {
            args[5] = args[5].map(mask => ({
                ...mask,
                Url: storage.mapImgSrc(mask.Url),
            }));
        }
        return next(args);
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
            const srcImage =
                args[4]?.image ??
                (activity.Item
                    ? PathTools.assetPreviewIconPath(activity.Item.Asset)
                    : `Assets/Female3DCG/Activity/${activity.Activity.Name}.png`);
            storage.mapImg(srcImage, (image: string) => {
                args[4] = { ...args[4], image };
            });
            return next(args);
        });

        HookManager.hookFunction('ElementButton.Create', 0, (args, next) => {
            if (args[0]?.startsWith('dialog-inventory')) {
                const options = args[2];
                if (options?.icons) {
                    options.icons = options.icons.map(icon => {
                        if (typeof icon === 'string' && icon.endsWith('Padlock')) {
                            const src = `Assets/Female3DCG/ItemMisc/Preview/${icon}.png`;
                            const img = storage.mapImgSrc(src);
                            if (img !== src) {
                                return {
                                    name: icon,
                                    iconSrc: img,
                                    tooltipText: InterfaceTextGet('PreviewIconPadlock').replace(
                                        'AssetName',
                                        AssetGet('Female3DCG', 'ItemMisc', icon)?.Description ?? icon
                                    ),
                                };
                            }
                        }
                        return icon;
                    });
                }
            }

            if (args[0]?.startsWith('dialog-expression-button-grid-Emoticon')) {
                const options = args[2];
                if (options?.image) {
                    options.image = storage.mapImgSrc(options.image);
                }
            }
            return next(args);
        });
    })();
}

class _ImageMapping {
    constructor () {
        setupImgMapping();
    }

    get storage () {
        return storage;
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

    /**
     * Create a virtual path alias that can be used to centrally redirect multiple
     * asset paths to a single destination.
     *
     * Usage pattern:
     * 1) Call {@link VirtualPath.map | map()} to associate one or more real asset paths with the alias
     * 2) Call {@link VirtualPath.resolve | resolve()} once to point the alias to a final URL or path
     *
     * Example:
     * ```ts
     * const v = ImageMapping.createVirtualPath('my://icons/Key');
     * v
     *   .map([
     *     'Assets/Female3DCG/ItemMisc/Key.png',
     *     'Assets/Female3DCG/ItemMisc/Key2.png',
     *   ])
     *   .resolve('https://cdn.example.com/assets/key.png?v=123');
     * ```
     *
     * Tip: Use a unique prefix (e.g. starting with 'your-protocol://') to avoid collisions with real asset paths.
     *
     * @param path The virtual alias key.
     * @returns A chainable {@link VirtualPath} helper bound to the internal storage.
     */
    createVirtualPath (path: string): VirtualPath {
        return new VirtualPath(path, storage);
    }
}

export const ImageMapping = Globals.get(`ImageMapping@${version}`, () => new _ImageMapping());
