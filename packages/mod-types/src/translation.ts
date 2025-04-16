import { CustomGroupName } from "./assets";

type I18NRecord<T> = Partial<Record<ServerChatRoomLanguage, T>>;

export namespace Translation {
    export type Languages = typeof TranslationLanguage;

    export type CustomRecord<T extends string, U> = I18NRecord<Partial<Record<T, U>>>;

    /**
     * Item description translation entry, with a solid CN entry
     */
    export type SolidEntry = Partial<Omit<Record<ServerChatRoomLanguage, string>,"CN">> & { CN: string };

    /**
     * Item description translation entry
     */
    export type Entry = I18NRecord<string>;

    /**
     * Custom dialog entries
     */
    export type Dialog = I18NRecord<Record<string, string>>;

    /**
     * Custom string entries, same as {@link Dialog}
     */
    export type String = Dialog;

    /**
     * Group-categorized description translation entries for multiple items
     */
    export type GroupedEntries<Custom extends string = AssetGroupBodyName> = CustomRecord<CustomGroupName<Custom>, Record<string, string>>;

    /**
     * Group-categorized, then asset-categoriezed, description translation entries. Used for layer names config.
     */
    export type GroupedAssetStrings<Custom extends string = AssetGroupBodyName> = CustomRecord<CustomGroupName<Custom>, Record<string, Record<string, string>>>;

    export type ActivityGroupName = AssetGroupItemName | 'ItemPenis' | 'ItemGlans';
    /**
     * Activity description translation entries
     */
    export type ActivityEntry = I18NRecord<Partial<Record<ActivityGroupName, string>>>;
}
