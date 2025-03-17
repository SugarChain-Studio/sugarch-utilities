import { CustomGroupName, Translation } from "./types";

/**
 * Internal function: Resolves translations with language fallback logic
 * @template {string|undefined} [F=undefined]
 * @param {(lang: string) => string | undefined} resolver - Function to resolve translations from a specific structure
 * @param {F} fallback - Fallback value
 * @returns {string | (F extends string ? string : undefined)} Translated text or fallback value
 */
function _resolveTranslation<F extends string | undefined = undefined>(
    resolver: (lang: ServerChatRoomLanguage) => string | undefined, 
    fallback: F
): string | (F extends string ? string : undefined) {
    const lang = TranslationLanguage !== "TW" ? TranslationLanguage : "CN";
    
    // First try the current language
    let result = resolver(lang);
    if (result !== undefined) return result;

    // Default fallback logic
    if (lang === "CN") {
        result = resolver("CN");
    } else {
        result = resolver("EN") || resolver("CN");
    }

    // If no translation found, return the fallback value
    return result !== undefined ? result : fallback as any;
}

/**
 * Extract translation from a Translation.Entry object
 * @template {string|undefined} [F=undefined]
 * @param {Translation.Entry} entry - Translation entry object containing language keys
 * @param {F} [fallback] - Fallback value to return if no translation is found
 * @returns {string | (F extends string ? string : undefined)} Translated text or fallback value
 */
export function translateEntry<F extends string | undefined = undefined>(
    entry: Translation.Entry, 
    fallback?: F
): string | (F extends string ? string : undefined) {
    if (!entry) throw new Error("Invalid translation entry or key");

    return _resolveTranslation((lang) => entry[lang], fallback as F);
}

/**
 * Extract translation from a Translation.Dialog object
 * @template {string|undefined} [F=undefined]
 * @param {Translation.Dialog} dialogs - Dialog entries object
 * @param {string} key - Dialog key to look up
 * @param {F} [fallback] - Fallback value to return if no translation is found
 * @returns {string | (F extends string ? string : undefined)} Translated text or fallback value
 */
export function translateDialog<F extends string | undefined = undefined>(
    dialogs: Translation.Dialog, 
    key: string, 
    fallback?: F
): string | (F extends string ? string : undefined) {
    if (!dialogs || !key) throw new Error("Invalid translation dialogs or key");

    return _resolveTranslation((lang) => dialogs[lang]?.[key], fallback as F);
}

/**
 * Extract translation from a Translation.GroupedEntries object
 * @template {string|undefined} [F=undefined]
 * @param {Translation.GroupedEntries} entries - Grouped entries object
 * @param {CustomGroupName} groupKey - Group key to look up
 * @param {string} translationKey - Translation key to look up in the language object
 * @param {F} [fallback] - Fallback value to return if no translation is found
 * @returns {string | (F extends string ? string : undefined)} Translated text or fallback value
 */
export function translateGroupedEntries<F extends string | undefined = undefined, Custom extends string = AssetGroupBodyName>(
    entries: Translation.GroupedEntries<Custom>, 
    groupKey: CustomGroupName<Custom>, 
    translationKey: string, 
    fallback?: F
): string | (F extends string ? string : undefined) {
    if (!entries || !groupKey || !translationKey)
        throw new Error("Invalid translation entries, groupKey or translationKey");

    return _resolveTranslation((lang) => entries[lang]?.[groupKey]?.[translationKey], fallback as F);
}