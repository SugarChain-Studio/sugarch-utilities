import { Globals } from './globals';

export class ImageMappingStorage {
    basic: Record<string, string>; // basicImgMapping
    custom: Record<string, string>; // customImgMapping

    constructor () {
        this.basic = {};
        this.custom = {};
    }

    /**
     * Add custom image mappings, **will** override existing mappings
     * @param mappings
     */
    addImgMapping (mappings: Record<string, string>): void {
        this.custom = { ...this.custom, ...mappings };
    }

    /**
     * Set basic image mappings, **will not** override existing mappings
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
     *
     * A typical process is as follows:
     *
     * Assets/Female3DCG/Cloth_笨笨蛋Luzi/Kneel/礼服_Luzi_Large_Bottom.png
     *
     * -> Assets/Female3DCG/Cloth/Kneel/礼服_Luzi_Large_Bottom.png (custom mapping, mirrored body group)
     *
     * -> ${baseURL}/Assets/Female3DCG/Cloth/Kneel/礼服_Luzi_Large_Bottom.png (basic mapping)
     */
    mapImgSrc<T extends string | HTMLImageElement | HTMLCanvasElement> (src: T): T {
        if (typeof src !== 'string') return src;
        if (!src.endsWith('.png')) return src;

        if (src.startsWith('data:image')) return src;
        if (src.startsWith('http')) return src;

        let test = src.startsWith('./') ? src.slice(2) : src;
        let test_return = test;
        if (this.custom[test_return]) test_return = this.custom[test_return];
        if (this.basic[test_return]) test_return = this.basic[test_return];
        if (test_return !== test) return test_return as T;
        return src;
    }

    /**
     * Map image source and call accept function if mapping occurs
     * @param src
     * @param accept
     */
    mapImg (src: string, accept: (src: string) => void): void {
        let result = src;

        if (result.startsWith('data:image') || result.startsWith('http')) return;
        if (this.custom[result]) result = this.custom[result];
        if (this.basic[result]) result = this.basic[result];

        if (result !== src) accept(result);
    }
}
