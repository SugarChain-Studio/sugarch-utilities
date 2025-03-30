
/** Image mapping type, used for mapping image names to their corresponding file paths */
export type ImageMappingRecord = Record<string, string>;

/** Tree structure for asset overrides */
export type AssetOverrideLeaf = string | AssetOverrideContainer;
export interface AssetOverrideContainer {
    [key: string]: AssetOverrideLeaf;
}