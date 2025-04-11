import { HookManager } from '@sugarch/bc-mod-hook-manager';
import type { Translation } from '@sugarch/bc-mod-types';
import { translateDialog } from './entryUtils';

/** Custom dialog translations */
const customDialog: Translation.Dialog = {};

/**
 * Add custom asset dialog translations with a prefix to the key
 * @param groupName prefix group name
 * @param assetName prefix asset name
 * @param dialog translation dialogs
 */
export function addCustomDialogWithPrefix (groupName: string, assetName: string, dialog: Translation.Dialog): void {
    for (const [key, value] of Object.entries(dialog) as [ServerChatRoomLanguage, Record<string, string>][]) {
        if (!customDialog[key]) {
            customDialog[key] = {};
        }
        for (const [k, v] of Object.entries(value)) {
            customDialog[key][`${groupName}${assetName}${k}`] = v;
        }
    }
}

/**
 * Add custom dialog translations. If it contains ItemTorso or ItemTorso2, automatically add the mirrored version
 * @param dialog The dialog translations to add
 */
export function addCustomDialog (dialog: Translation.Dialog): void {
    for (const [key, value] of Object.entries(dialog) as [ServerChatRoomLanguage, Record<string, string>][]) {
        if (!customDialog[key]) {
            customDialog[key] = {};
        }
        for (const [k, v] of Object.entries(value)) {
            customDialog[key][k] = v;
            if (k.includes('ItemTorso2')) {
                customDialog[key][k.replace('ItemTorso2', 'ItemTorso')] = v;
            } else if (k.includes('ItemTorso')) {
                customDialog[key][k.replace('ItemTorso', 'ItemTorso2')] = v;
            }
        }
    }
}

let customDialogLoaded = false;

/**
 * Set up custom dialog hooks
 */
export function setupCustomDialog (): void {
    if (customDialogLoaded) return;
    customDialogLoaded = true;

    const translate = (msg: string) => translateDialog(customDialog, msg);

    HookManager.progressiveHook('AssetTextGet').override((args, next) => translate(args[0]) || next(args));

    HookManager.progressiveHook('ChatRoomPublishCustomAction')
        .inject(args => {
            const [msg, _, Dictionary] = args;
            const tDialog = translate(msg);
            if (tDialog) Dictionary.push({ Tag: `MISSING TEXT IN "Interface.csv": ${msg}`, Text: tDialog });
        })
        .next();
}
