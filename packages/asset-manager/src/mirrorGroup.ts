import { CustomGroupName } from "@sugarch/bc-mod-types";

const TorsoMirror: Set<string> = new Set<string>(['ItemTorso', 'ItemTorso2']);
const mMirrorGroups: Record<string, Set<string>> = {
    ItemTorso: TorsoMirror,
    ItemTorso2: TorsoMirror,
};
const rMirrorPreimage: Record<string, string> = {};

const customMirrorGroups: Record<string, Set<string>> = {};

// Image mapping, assuming ItemTorso2's original content is already handled and doesn't need addition
const mirrorImgMapping: Record<`Assets/Female3DCG/${string}`, `Assets/Female3DCG/${string}`> = {};

/**
 * Register a mirror group for automatically adding mirrored items. By default, ItemTorso and ItemTorso2 are mirrored groups.
 * Note: When mirroring 'Cloth_Luzi' to 'Cloth' group, it doesn't automatically mirror 'Cloth' back to 'Cloth_Luzi'.
 * This allows mirror groups to register their own independent items.
 * @param from Source group name
 * @param to Target group name
 */
export function registerMirror<Custom extends string = AssetGroupBodyName> (
    from: CustomGroupName<Custom>,
    to: CustomGroupName<Custom>
): void {
    if (!mMirrorGroups[from]) mMirrorGroups[from] = new Set([from]);
    mMirrorGroups[from]!.add(to);

    if (!customMirrorGroups[from]) customMirrorGroups[from] = new Set();
    customMirrorGroups[from]!.add(to);

    rMirrorPreimage[to] = from;
    mirrorImgMapping[`Assets/Female3DCG/${to}`] = `Assets/Female3DCG/${from}`;
}

/**
 * Get all custom mirror groups
 */
export function getCustomMirrorGroups<Custom extends string = AssetGroupBodyName> (): Partial<
    Record<CustomGroupName<Custom>, Set<CustomGroupName<Custom>>>
> {
    return customMirrorGroups as Partial<Record<CustomGroupName<Custom>, Set<CustomGroupName<Custom>>>>;
}

/**
 * Resolve mirror groups
 * @param group Group name to resolve mirrors for
 * @returns Array of resolved group objects with name and group reference
 */
export function resolveMirror<Custom extends string = AssetGroupBodyName> (
    group: CustomGroupName<Custom>
): Array<{ name: CustomGroupName<Custom>; group: AssetGroup }> {
    return ((mMirrorGroups[group] && Array.from(mMirrorGroups[group]!)) || [group]).map(gname =>
        resolveSingle(gname)
    ) as Array<{ name: CustomGroupName<Custom>; group: AssetGroup }>;
}

/**
 * Resolve a single group name to its group object
 * @param group Group name to resolve
 */
export function resolveSingle<Custom extends string = AssetGroupBodyName> (
    group: CustomGroupName<Custom>
): { name: CustomGroupName<Custom>; group: AssetGroup } {
    return {
        name: group,
        group: AssetGroupGet('Female3DCG', group as AssetGroupName) as AssetGroup,
    };
}

const cache: Record<string, string> = {};

/**
 * Resolve mirror image mapping for a path
 * @param path Original image path
 * @returns Mapped image path if a mapping exists, otherwise the original path
 */
export function resolveMirrorImageMapping (path: string): string {
    if (cache[path]) return cache[path];

    for (const [key, value] of Object.entries(mirrorImgMapping)) {
        if (path.startsWith(key)) {
            cache[path] = path.replace(key, value);
            return cache[path];
        }
    }

    return path;
}

/**
 * Resolve preimage group for a mirrored group
 * @param group Group name to find preimage for
 * @returns Original group name if this is a mirror, otherwise undefined
 */
export function resolvePreimage<Custom extends string = AssetGroupBodyName> (
    group: CustomGroupName<Custom>
): CustomGroupName<Custom> | undefined {
    return rMirrorPreimage[group] as CustomGroupName<Custom> | undefined;
}
