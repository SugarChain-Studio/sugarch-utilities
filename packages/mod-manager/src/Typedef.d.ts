declare namespace ModManagerInterface {
    namespace _ {
        type PatchHook<T extends (...args: any[]) => any> = import('bondage-club-mod-sdk').PatchHook<T>;
        type GetDotedPathType<K extends string> = import('bondage-club-mod-sdk').GetDotedPathType<typeof globalThis, K>;
    }
    type ModSDKModInfo = import('bondage-club-mod-sdk').ModSDKModInfo;
    type ModSDKModAPI = import('bondage-club-mod-sdk').ModSDKModAPI;

    type HookFunction<T extends string> = _.PatchHook<_.GetDotedPathType<T>>;
    type FunctionArguments<T extends string> = Parameters<HookFunction<T>>[0];
    type FunctionType<T extends string> = Parameters<HookFunction<T>>[1];
    type FunctionReturnType<T extends string> = ReturnType<HookFunction<T>>;

    type InjectFunction<T extends string> = (...args: Parameters<HookFunction<T>>) => void;
    type CheckFunction<T extends string> = (...args: Parameters<HookFunction<T>>) => boolean;

    type HookableMod = {
        hookFunction<T extends string>(funcName: T, priority: number, hook: HookFunction<T>): void;
    };
}

declare namespace ProgressiveHookInterface {
    type InjectWork<T extends string> = { value: 'inject'; work: ModManagerInterface.InjectFunction<T> };
    type NextWork<T extends string> = { value: 'next' };
    type OverrideWork<T extends string> = { value: 'override'; work: ModManagerInterface.HookFunction<T> };
    type FlagWork<T extends string> = { value: 'flag'; flag: boolean; once: boolean };
    type CheckWork<T extends string> = { value: 'check'; work: ModManagerInterface.CheckFunction<T> };

    type WorkType<T extends string> = InjectWork<T> | NextWork<T> | OverrideWork<T> | FlagWork<T> | CheckWork<T>;
}