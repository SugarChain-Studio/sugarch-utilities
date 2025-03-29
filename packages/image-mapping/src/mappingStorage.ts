/**
 * Resolve the final mapping for a given key by following the chain.
 * @param key - The starting key
 * @param customSrc - The mapping to resolve against
 * @returns the resolved mapping value
 */
function resolveMapping (key: string, customSrc: Record<string, string>): string {
    const visited = new Set<string>();
    let current = key;

    while (customSrc[current]) {
        if (visited.has(current)) {
            console.warn(`Circular dependency detected during resolution: ${current}`);
            return '';
        }
        visited.add(current);
        current = customSrc[current];
    }

    return current;
}

/**
 * Optimize custom mappings to ensure only one transformation is needed.
 * @param customSrc - The mapping to optimize
 * @returns The optimized mapping, or null if a circular dependency is detected
 */
function optimizeCustomMappings (customSrc: Record<string, string>): Record<string, string> | null {
    const optimized: Record<string, string> = {};

    for (const key of Object.keys(customSrc)) {
        const resolvedValue = resolveMapping(key, customSrc);
        if (!resolvedValue) {
            console.warn(`Circular dependency detected during optimization: ${key}`);
            return null; // Return null to indicate failure
        }
        optimized[key] = resolvedValue;
    }

    return optimized;
}

export class ImageMappingStorage {
    /** basic image mapping */
    basic: Record<string, string>;

    /** custom image mapping, haven't optimized */
    customSrc: Record<string, string>;

    /** custom image mapping, optimized */
    custom: Record<string, string>;

    constructor () {
        this.basic = {};
        this.custom = {};
        this.customSrc = {};
    }

    /**
     * Add custom image mappings, **will** override existing mappings.
     * Checks for circular dependencies and optimizes the mapping.
     * @param mappings
     */
    addImgMapping (mappings: Record<string, string>): void {
        // Create temporary storage for new mappings
        const tempCustomSrc = { ...this.customSrc, ...mappings};

        // Optimize the temporary mappings
        const tempCustom = optimizeCustomMappings(tempCustomSrc);

        // If optimization fails, stop the process
        if (!tempCustom) {
            console.warn('Failed to add mappings due to circular dependencies.');
            return;
        }

        // If everything is valid, update the actual mappings
        this.customSrc = tempCustomSrc;
        this.custom = tempCustom;
    }

    /**
     * Set basic image mappings, **will not** override existing mappings.
     * @param mappings
     */
    setBasicImgMapping (mappings: Record<string, string>): void {
        this.basic = { ...mappings, ...this.basic };
    }

    /**
     * Image mapping occurs in two phases: basic mapping and custom mapping.
     * Basic mapping is generated during packaging, while custom mapping is added at runtime.
     *
     * Custom mapping must result in either a basic mapped image or a non-mapped image.
     */
    mapImgSrc<T extends string | HTMLImageElement | HTMLCanvasElement> (src: T): T {
        if (typeof src !== 'string') return src;
        if (!src.endsWith('.png')) return src;

        if (src.startsWith('data:image')) return src;
        if (src.startsWith('http')) return src;

        const test = src.startsWith('./') ? src.slice(2) : src;
        let testReturn = test;

        // Use optimized custom mapping
        if (this.custom[testReturn]) testReturn = this.custom[testReturn];
        if (this.basic[testReturn]) testReturn = this.basic[testReturn];

        if (testReturn !== test) return testReturn as T;
        return src;
    }

    /**
     * Map image source and call accept function if mapping occurs.
     * @param src
     * @param accept
     */
    mapImg (src: string, accept: (src: string) => void): void {
        let result = src;

        if (result.startsWith('data:image') || result.startsWith('http')) return;

        // Use optimized custom mapping
        if (this.custom[result]) result = this.custom[result];
        if (this.basic[result]) result = this.basic[result];

        if (result !== src) accept(result);
    }
}
