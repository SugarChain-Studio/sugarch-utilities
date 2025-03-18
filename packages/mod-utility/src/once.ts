import { Globals } from "./globals";

const globalName = 'OnceFlag';

const storage = Globals.createNamespace(globalName);

/**
 * Execute a callback once per tag
 * @param {string} tag
 */
export function once (tag: string, callback: () => void) {
    if (!storage.get(tag, () => false)) {
        storage.set(tag, true);
        callback();
    }
}
