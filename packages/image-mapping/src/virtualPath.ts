import { ImageMappingStorage } from "./mappingStorage";

/**
 * A tiny helper to build a two-step mapping using a stable virtual key.
 *
 * Concept:
 * - First, map one or more real asset paths to a virtual path (alias) via {@link map}.
 * - Then, resolve that virtual path to a final URL or another path via {@link resolve}.
 *
 * This indirection lets you update the real destination in one place while
 * keeping all source paths pointing to the same virtual key.
 *
 * Example
 * ```ts
 * const v = ImageMapping.createVirtualPath('@my/icons/Key');
 * v
 *   .map([
 *     'Assets/Female3DCG/ItemMisc/Key.png',
 *     'Assets/Female3DCG/ItemMisc/Key2.png',
 *   ])
 *   .resolve('https://cdn.example.com/assets/key.png?v=123');
 * // Any draw/load for the two asset paths will be redirected to the CDN URL.
 * ```
 */
export class VirtualPath {
    /**
     * Create a virtual path builder.
     * @param path The virtual key/alias. Prefer a unique, non-colliding namespace
     *             (e.g. starting with '@' or a custom prefix) to avoid clashing with real asset paths.
     * @param storage The shared image mapping storage to mutate.
     */
    constructor(public readonly path: string, readonly storage: ImageMappingStorage) {}

    /**
     * Map one or more real asset paths to this virtual alias.
     *
     * After calling this, lookups for each provided path will first resolve to the
     * virtual path held by this instance. Call {@link resolve} to point that virtual
     * path to an actual URL.
     *
     * @param from One or many real asset paths to redirect to the virtual alias.
     * @returns This instance for chaining.
     */
    map(from: string | string[]) {
        const paths = Array.isArray(from) ? from : [from];
        const mappings: Record<string, string> = {};
        for (const p of paths) {
            mappings[p] = this.path;
        }
        this.storage.addImgMapping(mappings);
        return this;
    }

    /**
     * Resolve this virtual alias to a final URL or another path.
     *
     * You can provide an absolute URL (e.g. from a CDN) or another internal path.
     *
     * @param to The final destination to map the virtual alias to.
     * @returns This instance for chaining.
     */
    resolve(to: string) {
        this.storage.addImgMapping({ [this.path]: to });
        return this;
    }
}