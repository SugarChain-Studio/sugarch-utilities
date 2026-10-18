import { Globals, once } from '@sugarch/bc-mod-utility';
import { HookManager } from '@sugarch/bc-mod-hook-manager';
import { sleepUntil, PathTools } from '@sugarch/bc-mod-utility';
import { ImageMappingStorage } from './mappingStorage';
import { version } from './package';
import { VirtualPath } from './virtualPath';

const storage = new ImageMappingStorage();

/**
 * Conditional request headers the game's image cache adds when it revalidates a
 * cached entry.
 *
 * None of these is a CORS-safelisted request header, so sending one on a
 * cross-origin image turns a plain GET into a preflighted request. The host then
 * has to echo it in `Access-Control-Allow-Headers`, which image hosts generally
 * don't: jsDelivr only answers `Access-Control-Allow-Origin`, and typical static
 * dev servers allow a short fixed list.
 *
 * They are only dropped for cross-origin requests. Same-origin requests are never
 * touched, so their conditional headers keep revalidation on the 304 path.
 */
const CONDITIONAL_HEADERS = ['if-match', 'if-none-match', 'if-modified-since', 'if-unmodified-since', 'if-range'];

/**
 * Copy a request's headers, minus the conditional ones.
 *
 * Only called for cross-origin requests; see {@link CONDITIONAL_HEADERS}.
 */
function withoutConditionalHeaders (request: Request): Headers {
    const headers = new Headers(request.headers);
    for (const name of CONDITIONAL_HEADERS) headers.delete(name);
    return headers;
}

/**
 * Rewrite a cross-origin request as an explicit CORS request without credentials.
 *
 * Accepts every shape `CommonFetch` is called with: a plain URL string, a `URL`,
 * or a `Request`. The image cache revalidation builds a `Request` so it can send
 * conditional headers; every other header, the method, the body and the signal are
 * kept, but the conditional headers are dropped so the request stays a CORS simple
 * request and skips the preflight. The cost is that cross-origin revalidation
 * always downloads the image again instead of getting a 304; keeping the cached
 * copy fresh matters more than the bandwidth.
 *
 * Returns undefined when the input must be left completely untouched:
 * - same-origin requests, which keep their conditional headers and the 304 path;
 * - non-http URLs;
 * - requests that deliberately opt out of CORS or ask for credentials.
 */
function toCorsRequest (input: string | URL | Request): Request | undefined {
    const isRequest = input instanceof Request;

    let url: URL;
    try {
        url = new URL(isRequest ? input.url : String(input), location.href);
    } catch {
        return undefined;
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;

    // Same origin: leave the request, its conditional headers and its 304 path alone.
    if (url.origin === location.origin) return undefined;

    if (isRequest && (input.mode !== 'cors' || input.credentials === 'include')) return undefined;

    try {
        return new Request(isRequest ? input : url.href, {
            mode: 'cors',
            credentials: 'omit',
            headers: isRequest ? withoutConditionalHeaders(input) : undefined,
        });
    } catch {
        // Unusable request, e.g. its body was already consumed; leave it untouched.
        return undefined;
    }
}

/**
 * Request cross-origin images explicitly in CORS mode.
 *
 * R133 loads images through the fetch()-based `ImageCache`, and every one of its
 * requests ends up in `CommonFetch`. `fetch` already defaults to `mode: "cors"`
 * and sends no credentials for other origins, but the requirement is stated here
 * instead of being left implicit: mod images live on other origins and can only
 * be decoded into textures when the host answers with `Access-Control-Allow-Origin`.
 *
 * Only cross-origin requests are rewritten. Same-origin requests are passed through
 * untouched, conditional headers included, so the game keeps its 304 revalidation.
 */
function setupCrossOriginFetch (): void {
    if (typeof CommonFetch !== 'function') return;

    once('ImgMappingOnce.CommonFetch.cors', () => {
        HookManager.hookFunction('CommonFetch', 0, (args, next) => {
            const [input] = args;
            if (typeof input !== 'string' && !(input instanceof URL) && !(input instanceof Request)) {
                return next(args);
            }

            const request = toCorsRequest(input);
            if (request) args[0] = request;
            return next(args);
        });
    });
}

function setupImgMapping (): void {
    // Cross-origin image loading used to require patching GLDrawLoadImage to set
    // crossOrigin on the <img> elements it created. R133 dropped those elements in
    // favour of the fetch()-based ImageCache, so the requirement is now expressed
    // on the request itself, in setupCrossOriginFetch.
    setupCrossOriginFetch();

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
                    : `Icons/Activity/${activity.Activity.Name}.png`);
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
