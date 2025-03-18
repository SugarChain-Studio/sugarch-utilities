import { CustomGroupName } from "./assets";

export namespace Translation {
    export type Languages = typeof TranslationLanguage;

    export type CustomRecord<T extends string, U> = Partial<Record<ServerChatRoomLanguage, Partial<Record<T, U>>>>;

    /**
     * Item description translation entry, with a solid CN entry
     */
    export type SolidEntry = Partial<Omit<Record<ServerChatRoomLanguage, string>,"CN">> & { CN: string };

    /**
     * Item description translation entry
     */
    export type Entry = Partial<Record<ServerChatRoomLanguage, string>>;

    /**
     * Custom dialog entries
     */
    export type Dialog = Partial<Record<ServerChatRoomLanguage, Record<string, string>>>;

    /**
     * Group-categorized description translation entries for multiple items
     */
    export type GroupedEntries<Custom extends string = AssetGroupBodyName> = CustomRecord<CustomGroupName<Custom>, Record<string, string>>;
}
