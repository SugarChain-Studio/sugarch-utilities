import type { CustomGroupName, Translation } from "@sugarch/bc-mod-types";

/**
 * Internal function: Resolves translations with language fallback logic
 * @param resolver - Function to resolve translations from a specific structure
 * @param fallback - Fallback value
 * @returns Translated text or fallback value
 */
function _resolveTranslation<F extends string | undefined = undefined> (
    resolver: (lang: ServerChatRoomLanguage) => string | undefined,
    fallback: F
) {
    const lang = TranslationLanguage !== 'TW' ? TranslationLanguage : 'CN';

    // First try the current language
    let result = resolver(lang);
    if (result !== undefined) return result;

    // Default fallback logic
    if (lang === 'CN') {
        result = resolver('CN');
    } else {
        result = resolver('EN') || resolver('CN');
    }

    // If no translation found, return the fallback value
    return (result !== undefined ? result : fallback) as F;
}

/**
 * Extract translation from a Translation.Entry object
 * @param entry - Translation entry object containing language keys
 * @param fallback - Fallback value to return if no translation is found
 * @returns  Translated text or fallback value
 */
export function translateEntry<F extends string | undefined = undefined> (entry: Translation.Entry, fallback?: F) {
    return _resolveTranslation(lang => entry[lang], fallback as F);
}

/**
 * Extract translation from a Translation.Dialog object
 * @param dialogs - Dialog entries object
 * @param key - Dialog key to look up
 * @param fallback - Fallback value to return if no translation is found
 * @returns Translated text or fallback value
 */
export function translateDialog<F extends string | undefined = undefined> (
    dialogs: Translation.Dialog,
    key: string,
    fallback?: F
) {
    return _resolveTranslation(lang => dialogs[lang]?.[key], fallback as F);
}

/**
 * Extract translation from a Translation.GroupedEntries object
 * @param entries - Grouped entries object
 * @param groupKey - Group key to look up
 * @param translationKey - Translation key to look up in the language object
 * @param fallback - Fallback value to return if no translation is found
 * @returns Translated text or fallback value
 */
export function translateGroupedEntries<
    F extends string | undefined = undefined,
    Custom extends string = AssetGroupBodyName
> (
    entries: Translation.GroupedEntries<Custom>,
    groupKey: CustomGroupName<Custom>,
    translationKey: string,
    fallback?: F
) {
    return _resolveTranslation(lang => entries[lang]?.[groupKey]?.[translationKey], fallback as F);
}
