import { translateEntry, translateGroupedEntries, translateString } from './entryUtils';

export { Translation } from '@sugarch/bc-mod-types';

class _TranslationUtility {
    translateEntry = translateEntry;
    translateString = translateString;
    translateGroupedEntries = translateGroupedEntries;
}

export const TranslationUtility = new _TranslationUtility();
