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
        export type Base<T extends string = AssetGroupBodyName> = details.ExtendType<
            AssetDefinitionBase,
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

/** 
 * Custom body group definition, supports custom body group names 
 * @template Custom - Custom group name
 */
export type CustomGroupDefinition<Custom extends string = AssetGroupBodyName> =
    | details.CGroupDef.Item<Custom>
    | details.CGroupDef.Appearance<Custom>
    | details.CGroupDef.Script<Custom>;

/** 
 * Custom item asset definition 
 * @template Custom - Custom group name
 */
export type CustomAssetDefinitionItem<Custom extends string = AssetGroupBodyName> = details.CAssetDef.Item<Custom>;

/** 
 * Custom appearance asset definition 
 * @template Custom - Custom group name
 */
export type CustomAssetDefinitionAppearance<Custom extends string = AssetGroupBodyName> =
    details.CAssetDef.Appearance<Custom>;

/**
 * A basic asset definition that supports items, appearances, and scripts
 * @template Custom - Custom group name
 */
export type CustomAssetDefinitionBase<Custom extends string = AssetGroupBodyName> = details.CAssetDef.Base<Custom>;

/** 
 * Custom asset definition, supports extended body group names 
 * @template Custom - Custom group name
 */
export type CustomAssetDefinition<Custom extends string = AssetGroupBodyName> =
    | CustomAssetDefinitionItem<Custom>
    | CustomAssetDefinitionAppearance<Custom>
    | details.CAssetDef.Script<Custom>;

/** 
 * Asset definitions grouped by body group
 * @template Custom - Custom group name
 */
export type CustomGroupedAssetDefinitions<Custom extends string = AssetGroupBodyName> =
    details.GroupedAssetType<Custom>;
