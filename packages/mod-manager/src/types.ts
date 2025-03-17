export namespace ModManagerInterface {
    type PatchHook<T extends (...args: any[]) => any> = import('bondage-club-mod-sdk').PatchHook<T>;
    type GetDotedPathType<K extends string> = import('bondage-club-mod-sdk').GetDotedPathType<typeof globalThis, K>;

    export type ModSDKModInfo = import('bondage-club-mod-sdk').ModSDKModInfo;
    export type ModSDKModAPI = import('bondage-club-mod-sdk').ModSDKModAPI;

    export type HookFunction<T extends string> = PatchHook<GetDotedPathType<T>>;
    export type FunctionArguments<T extends string> = Parameters<HookFunction<T>>[0];
    export type FunctionType<T extends string> = Parameters<HookFunction<T>>[1];
    export type FunctionReturnType<T extends string> = ReturnType<HookFunction<T>>;

    export type InjectFunction<T extends string> = (...args: Parameters<HookFunction<T>>) => void;
    export type CheckFunction<T extends string> = (...args: Parameters<HookFunction<T>>) => boolean;

    export type HookableMod = {
        hookFunction<T extends string>(funcName: T, priority: number, hook: HookFunction<T>): void;
    };
}

export namespace ProgressiveHookInterface {
    export type InjectWork<T extends string> = { value: 'inject'; work: ModManagerInterface.InjectFunction<T> };
    export type NextWork<T extends string> = { value: 'next' };
    export type OverrideWork<T extends string> = { value: 'override'; work: ModManagerInterface.HookFunction<T> };
    export type FlagWork<T extends string> = { value: 'flag'; flag: boolean; once: boolean };
    export type CheckWork<T extends string> = { value: 'check'; work: ModManagerInterface.CheckFunction<T> };

    export type WorkType<T extends string> = InjectWork<T> | NextWork<T> | OverrideWork<T> | FlagWork<T> | CheckWork<T>;
}

export type FuncWork<T extends any[] = []> = (...args: T) => void;