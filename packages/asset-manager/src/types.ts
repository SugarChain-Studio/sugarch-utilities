/**
 * Extended group name for custom asset group.
 */
export type CustomGroupName<Custom extends string = AssetGroupBodyName> = AssetGroupItemName | Custom | AssetGroupScriptName;

namespace details {
    export type ExtendType<T, From, To> = { [K in keyof T]: T[K] extends From ? To : ExtendType<T[K], From, To> };
    export type SetType<S, K extends keyof T, T> = Omit<S, K> & { [P in K]: T };

    export namespace CGroupDef {
        export type Item<T extends string = AssetGroupBodyName> = details.ExtendType<
            AssetGroupDefinition.Item,
            AssetGroupName,
            CustomGroupName<T>
        >;
        export type Appearance<T extends string = AssetGroupBodyName> = details.ExtendType<
            AssetGroupDefinition.Appearance,
            AssetGroupName,
            CustomGroupName<T>
        >;
        export type Script<_ extends string = AssetGroupBodyName> = AssetGroupDefinition.Script;
    }

    export namespace CAssetDef {
        export type Item<T extends string = AssetGroupBodyName> = details.ExtendType<
            AssetDefinition.Item,
            AssetGroupName,
            CustomGroupName<T>
        >;
        export type Appearance<T extends string = AssetGroupBodyName> = details.ExtendType<
            AssetDefinition.Appearance,
            AssetGroupName,
            CustomGroupName<T>
        >;
        export type Script<_ extends string = AssetGroupBodyName> = AssetDefinition.Script;
    }

    export type GroupedAssetType<T extends string = AssetGroupBodyName> = {
        [K in CustomGroupName<T>]?: K extends AssetGroupItemName
            ? CAssetDef.Item<T>[]
            : K extends T
            ? CAssetDef.Appearance<T>[]
            : K extends AssetGroupScriptName
            ? CAssetDef.Script<T>[]
            : never;
    };
}

/** Custom body group definition, supports custom body group names */
export type CustomGroupDefinition<Custom extends string = AssetGroupBodyName> =
    | details.CGroupDef.Item<Custom>
    | details.CGroupDef.Appearance<Custom>
    | details.CGroupDef.Script<Custom>;

/** Custom item asset definition */
export type CustomAssetDefinitionItem<Custom extends string = AssetGroupBodyName> = details.CAssetDef.Item<Custom>;

/** Custom appearance asset definition */
export type CustomAssetDefinitionAppearance<Custom extends string = AssetGroupBodyName> = details.CAssetDef.Appearance<Custom>;

/** Custom asset definition, supports extended body group names */
export type CustomAssetDefinition<Custom extends string = AssetGroupBodyName> =
    | CustomAssetDefinitionItem<Custom>
    | CustomAssetDefinitionAppearance<Custom>
    | details.CAssetDef.Script<Custom>;

/** Asset definitions grouped by body group */
export type CustomGroupedAssetDefinitions<Custom extends string = AssetGroupBodyName> = details.GroupedAssetType<Custom>;

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FuncWork<T extends any[] = []> = (...args: T) => void;