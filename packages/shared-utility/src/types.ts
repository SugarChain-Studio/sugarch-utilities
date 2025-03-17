
/** Custom image mapping */
export type ImageMappingRecord = Record<string, string>;

export type AssetOverrideLeaf = string | AssetOverrideContainer;
export interface AssetOverrideContainer {
    [key: string]: AssetOverrideLeaf;
}
