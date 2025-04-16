import { HookManager } from '@sugarch/bc-mod-hook-manager';
import type { Translation } from '@sugarch/bc-mod-types';
import { translateString } from './entryUtils';

/** Custom dialog translations */
const customAssetString: Translation.String = {};

/**
 * Add custom asset dialog translations with a prefix to the key
 * @param groupName prefix group name
 * @param assetName prefix asset name
 * @param dialog translation dialogs
 */
export function addCustomAssetStringWithPrefix (groupName: string, assetName: string, dialog: Translation.String): void {
    for (const [key, value] of Object.entries(dialog) as [ServerChatRoomLanguage, Record<string, string>][]) {
        if (!customAssetString[key]) {
            customAssetString[key] = {};
        }
        for (const [k, v] of Object.entries(value)) {
            customAssetString[key][`${groupName}${assetName}${k}`] = v;
        }
    }
}

/**
 * Add custom dialog translations. If it contains ItemTorso or ItemTorso2, automatically add the mirrored version
 * @param dialog The dialog translations to add
 */
export function addCustomAssetString (dialog: Translation.String): void {
    for (const [key, value] of Object.entries(dialog) as [ServerChatRoomLanguage, Record<string, string>][]) {
        if (!customAssetString[key]) {
            customAssetString[key] = {};
        }
        for (const [k, v] of Object.entries(value)) {
            customAssetString[key][k] = v;
            if (k.includes('ItemTorso2')) {
                customAssetString[key][k.replace('ItemTorso2', 'ItemTorso')] = v;
            } else if (k.includes('ItemTorso')) {
                customAssetString[key][k.replace('ItemTorso', 'ItemTorso2')] = v;
            }
        }
    }
}

let customAssetStringLoaded = false;

/**
 * Set up custom dialog hooks
 */
export function setupCustomAssetString (): void {
    if (customAssetStringLoaded) return;
    customAssetStringLoaded = true;

    const translate = (msg: string) => translateString(customAssetString, msg);

    HookManager.progressiveHook('AssetTextGet').override((args, next) => translate(args[0]) || next(args));

    HookManager.progressiveHook('ChatRoomPublishCustomAction')
        .inject(args => {
            const [msg, _, Dictionary] = args;
            const tDialog = translate(msg);
            if (tDialog) Dictionary.push({ Tag: `MISSING TEXT IN "Interface.csv": ${msg}`, Text: tDialog });
        })
        .next();
}
