import { HookManager, HookManagerInterface } from '@sugarch/bc-mod-hook-manager';
import { queryMirrorPreimage } from './mirrorGroup';
import { checkItemCustomed, getCustomAssets, isInListCustomAsset, useValidator } from './customStash';

/**
 * Enable custom assets in the game
 */
export function enableCustomAssets(): void {
    let doInventoryAdd = false;

    HookManager.hookFunction('DialogInventoryBuild', 0, (args, next) => {
        if (!args[2]) {
            doInventoryAdd = DialogMenuMode !== 'permissions';
        }
        const ret = next(args);
        if (
            (DialogMenuMode === 'items' || DialogMenuMode === null) &&
            useValidator &&
            !args[0].IsPlayer() &&
            !useValidator(args[0])
        ) {
            DialogInventory = DialogInventory.filter((item) => !checkItemCustomed(item));
        }
        return ret;
    });

    const preAvailable: (typeof globalThis)['InventoryAvailable'] = (C, N, G) => {
        const pre = queryMirrorPreimage(G);
        return pre ? HookManager.invokeOriginal('InventoryAvailable', C, N, pre) : false;
    };

    HookManager.hookFunction('DialogInventoryAdd', 10, (args, next) => {
        const ret = next(args);
        if (!doInventoryAdd) return ret;
        doInventoryAdd = false;

        const groupName = args[1].Asset.Group.Name;
        const added = new Set(DialogInventory.map((item) => item.Asset.Name));
        const content = getCustomAssets()[groupName];
        if (!content) return ret;

        Object.entries(content)
            .filter(([assetName]) => !added.has(assetName))
            .filter(([assetName, asset]) => asset.Value >= 0 || preAvailable(args[0], assetName, groupName))
            .forEach(([_, asset]) => DialogInventoryAdd(args[0], { Asset: asset }, false));

        return ret;
    });

    const insides = [
        HookManager.insideFlag('CharacterAppearanceValidate'),
        HookManager.insideFlag('CraftingItemListBuild'),
        HookManager.insideFlag('WardrobeFastLoad'),
        HookManager.insideFlag('CraftingValidate'),
    ];

    const overrideAvailable = (
        ...[args, next]: Parameters<HookManagerInterface.HookFunction<'InventoryAvailable'>>
    ) => {
        if (!insides.some((flag) => flag.inside)) return next(args);
        if (isInListCustomAsset(args[2], args[1]) || preAvailable(...args)) return true;
        return next(args);
    };

    HookManager.hookFunction('InventoryAvailable', 0, overrideAvailable);
}
