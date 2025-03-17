import bcModSdk from 'bondage-club-mod-sdk';
import { ProgressiveHook } from './progressiveHook';
import { FuncWork, ModManagerInterface } from './types';
import { DefaultLogger, Logger, setLogger } from './logger';

class WorkList {
    done: boolean;
    list: FuncWork[];

    constructor (done = false) {
        this.done = done;
        this.list = [];
    }

    run () {
        this.done = true;
        while (this.list.length > 0) this.list.shift()!();
    }

    push (work: FuncWork) {
        if (this.done) work();
        else this.list.push(work);
    }
}

const afterInitList = new WorkList();
const hookList = new WorkList();
const waitPlayerHookList = new WorkList();
const patchList = new WorkList();

function PlayerLoaded (): boolean {
    return globalThis['Player'] != undefined && typeof globalThis['Player']['MemberNumber'] === 'number';
}

function PlayerHook (work: FuncWork) {
    if (PlayerLoaded()) {
        waitPlayerHookList.push(work);
    } else {
        work();
    }
}

let mMod: ModManagerInterface.ModSDKModAPI | undefined = undefined;

export class ModManager {
    static get mod () {
        return mMod;
    }

    static push (list: WorkList, work: FuncWork) {
        list.push(work);
    }

    /**
     * Register mod
     * @param modinfo the mod info to register
     */
    static init (modinfo: ModManagerInterface.ModSDKModInfo) {
        mMod = bcModSdk.registerMod(modinfo);
        patchList.run();
        hookList.run();

        const wk = () => waitPlayerHookList.run();

        if (PlayerLoaded()) {
            wk();
        } else {
            ModManager.mod!.hookFunction('LoginResponse', 0, (args, next) => {
                next(args);
                if (PlayerLoaded()) wk();
            });
        }

        afterInitList.run();
    }

    /**
     * Register mod using an already initialized mod
     * @param mod a registered mod
     */
    static initWithMod (mod: ModManagerInterface.ModSDKModAPI) {
        mMod = mod;
        patchList.run();
        hookList.run();

        const wk = () => waitPlayerHookList.run();

        if (PlayerLoaded()) {
            wk();
        } else {
            ModManager.mod!.hookFunction('LoginResponse', 0, (args, next) => {
                next(args);
                if (PlayerLoaded()) wk();
            });
        }
    }

    /**
     * Add a callback after initialization, executed when the mod is initialized.
     * If the mod is already initialized, execute immediately.
     * @param work
     */
    static afterInit (work: FuncWork) {
        ModManager.push(afterInitList, work);
    }

    /**
     * Add a callback after player login, executed when the player logs in.
     * If the player is already logged in, execute immediately.
     * @param work
     */
    static afterPlayerLogin (work: FuncWork) {
        ModManager.push(waitPlayerHookList, work);
    }

    /**
     * Patch function
     * @param functionName
     * @param patch
     */
    static patchFunction (functionName: string, patch: Record<string, string | null>) {
        ModManager.push(patchList, () => ModManager.mod!.patchFunction(functionName, patch));
    }

    /**
     * Invoke original function
     * @template TFunctionName
     * @param functionName function name
     * @param args function arguments
     */
    static invokeOriginal<TFunctionName extends string> (
        functionName: TFunctionName,
        ...args: ModManagerInterface.FunctionArguments<TFunctionName>
    ): ModManagerInterface.FunctionReturnType<TFunctionName> {
        if (!ModManager.mod) return (globalThis as any)[functionName]?.(...args);
        else return ModManager.mod.callOriginal(functionName, args);
    }

    /**
     * Register a hook function
     * @template TFunctionName
     * @param funcName function name
     * @param priority hook priority
     * @param hook hook function
     */
    static hookFunction<TFunctionName extends string> (
        funcName: TFunctionName,
        priority: number,
        hook: ModManagerInterface.HookFunction<TFunctionName>
    ) {
        ModManager.push(hookList, () => ModManager.mod!.hookFunction(funcName, priority, hook));
    }

    /**
     * Assemble hook functions step by step!
     * @param funcName function name
     * @param priority hook priority
     * @returns ProgressiveHook instance
     */
    static progressiveHook<TFunctionName extends string> (
        funcName: TFunctionName,
        priority = 1
    ): ProgressiveHook<TFunctionName> {
        const hook = new ProgressiveHook<TFunctionName>(ModManager);
        ModManager.hookFunction(funcName, priority, (args, next) => hook.run(args, next));
        return hook;
    }

    /**
     * Register a hook function that depends on the player, executed after player data is loaded.
     * If player data is already loaded, execute immediately.
     * @template TFunctionName
     * @param funcName function name
     * @param priority hook priority
     * @param hook hook function
     */
    static hookPlayerFunction<TFunctionName extends string> (
        funcName: TFunctionName,
        priority: number,
        hook: ModManagerInterface.HookFunction<TFunctionName>
    ) {
        PlayerHook(() => ModManager.mod!.hookFunction(funcName, priority, hook));
    }

    /**
     * Register a global function (accessible via globalThis)
     * @param funcName function name
     * @param func the function to register
     */
    static globalFunction (funcName: string, func: Function) {
        if (typeof func != 'function') {
            Logger.warn('globalFunction: param is not a function');
        }
        if ((globalThis as any)[funcName] == undefined) {
            (globalThis as any)[funcName] = func;
        } else if ((globalThis as any)[funcName] != func) {
            Logger.warn(`globalFunction: ${funcName} is already defined`);
        }
    }

    /**
     * Register a global function with a randomly generated name
     * @template T
     * @template R
     * @param funcPrefix the prefix of the function name
     * @param func the function to register
     * @returns randomly generated function name
     */
    static randomGlobalFunction<T extends any[], R> (funcPrefix: string, func: (...args: T) => R): string {
        const genName = (prefix: string) => prefix + Math.random().toString(16).substring(2);
        let funcName = genName(funcPrefix);
        while ((globalThis as any)[funcName] != undefined) {
            funcName = genName(funcPrefix);
        }
        (globalThis as any)[funcName] = func;
        return funcName;
    }

    /**
     * Override the default logger
     * @param logger
     */
    static setLogger(logger: typeof DefaultLogger) {
        setLogger(logger);
    }
}
