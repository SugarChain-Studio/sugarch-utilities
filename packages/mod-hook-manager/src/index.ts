import bcModSdk from 'bondage-club-mod-sdk';
import { ProgressiveHook } from './progressiveHook';
import { HookManagerInterface } from './types';
import { FuncWork } from '@sugarch/bc-mod-types';
import { ILogger, Logger, setLogger } from './logger';
export {HookManagerInterface};

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

function playerLoaded (): boolean {
    return globalThis['Player'] != undefined && typeof globalThis['Player']['MemberNumber'] === 'number';
}

function playerHook (work: FuncWork) {
    if (playerLoaded()) {
        waitPlayerHookList.push(work);
    } else {
        work();
    }
}

let mMod: HookManagerInterface.ModSDKModAPI | undefined = undefined;

class _HookManager {
    get mod () {
        return mMod;
    }

    push (list: WorkList, work: FuncWork) {
        list.push(work);
    }

    /**
     * Register mod
     * @param modinfo the mod info to register
     */
    init (modinfo: HookManagerInterface.ModSDKModInfo) {
        mMod = bcModSdk.registerMod(modinfo);
        patchList.run();
        hookList.run();

        const wk = () => waitPlayerHookList.run();

        if (playerLoaded()) {
            wk();
        } else {
            this.mod!.hookFunction('LoginResponse', 0, (args, next) => {
                next(args);
                if (playerLoaded()) wk();
            });
        }

        afterInitList.run();
    }

    /**
     * Register mod using an already initialized mod
     * @param mod a registered mod
     */
    initWithMod (mod: HookManagerInterface.ModSDKModAPI) {
        mMod = mod;
        patchList.run();
        hookList.run();

        const wk = () => waitPlayerHookList.run();

        if (playerLoaded()) {
            wk();
        } else {
            this.mod!.hookFunction('LoginResponse', 0, (args, next) => {
                next(args);
                if (playerLoaded()) wk();
            });
        }
    }

    /**
     * Add a callback after initialization, executed when the mod is initialized.
     * If the mod is already initialized, execute immediately.
     * @param work
     */
    afterInit (work: FuncWork) {
        this.push(afterInitList, work);
    }

    /**
     * Add a callback after player login, executed when the player logs in.
     * If the player is already logged in, execute immediately.
     * @param work
     */
    afterPlayerLogin (work: FuncWork) {
        this.push(waitPlayerHookList, work);
    }

    /**
     * Patch function
     * @param functionName
     * @param patch
     */
    patchFunction (functionName: string, patch: Record<string, string | null>) {
        this.push(patchList, () => this.mod!.patchFunction(functionName, patch));
    }

    /**
     * Invoke original function, if mod is not registered, call the original function directly
     * @param functionName function name
     * @param args function arguments
     */
    invokeOriginal<TFunctionName extends string> (
        functionName: TFunctionName,
        ...args: HookManagerInterface.FunctionArguments<TFunctionName>
    ): HookManagerInterface.FunctionReturnType<TFunctionName> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!this.mod) return (globalThis as any)[functionName]?.(...args);
        else return this.mod.callOriginal(functionName, args);
    }

    /**
     * Register a hook function
     * @param funcName function name
     * @param priority hook priority
     * @param hook hook function
     */
    hookFunction<TFunctionName extends string> (
        funcName: TFunctionName,
        priority: number,
        hook: HookManagerInterface.HookFunction<TFunctionName>
    ) {
        this.push(hookList, () => this.mod!.hookFunction(funcName, priority, hook));
    }

    /**
     * Assemble hook functions step by step!
     * @param funcName function name
     * @param priority hook priority
     * @returns ProgressiveHook instance
     */
    progressiveHook<TFunctionName extends string> (
        funcName: TFunctionName,
        priority = 1
    ): ProgressiveHook<TFunctionName> {
        const hook = new ProgressiveHook<TFunctionName>(this);
        this.hookFunction(funcName, priority, (args, next) => hook.run(args, next));
        return hook;
    }

    /**
     * Register a hook function that depends on the player, executed after player data is loaded.
     * If player data is already loaded, execute immediately.
     * @param funcName function name
     * @param priority hook priority
     * @param hook hook function
     */
    hookPlayerFunction<TFunctionName extends string> (
        funcName: TFunctionName,
        priority: number,
        hook: HookManagerInterface.HookFunction<TFunctionName>
    ) {
        playerHook(() => this.mod!.hookFunction(funcName, priority, hook));
    }

    /**
     * Register a global function (accessible via globalThis)
     * @param funcName function name
     * @param func the function to register
     */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    globalFunction (funcName: string, func: Function) {
        if (typeof func != 'function') {
            Logger.warn('globalFunction: param is not a function');
        }
        /* eslint-disable @typescript-eslint/no-explicit-any */
        if ((globalThis as any)[funcName] == undefined) {
            (globalThis as any)[funcName] = func;
        } else if ((globalThis as any)[funcName] != func) {
            Logger.warn(`globalFunction: ${funcName} is already defined`);
        }
        /* eslint-enable @typescript-eslint/no-explicit-any */
    }

    /**
     * Register a global function with a randomly generated name
     * @param funcPrefix the prefix of the function name
     * @param func the function to register
     * @returns randomly generated function name
     */
    /* eslint-disable @typescript-eslint/no-explicit-any */
    randomGlobalFunction<T extends any[], R> (funcPrefix: string, func: (...args: T) => R): string {
        const genName = (prefix: string) => prefix + Math.random().toString(16).substring(2);
        let funcName = genName(funcPrefix);
        while ((globalThis as any)[funcName] != undefined) {
            funcName = genName(funcPrefix);
        }
        (globalThis as any)[funcName] = func;
        return funcName;
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    /**
     * Override the default logger
     * @param logger
     */
    setLogger (logger: ILogger) {
        setLogger(logger);
    }
}

export const HookManager = new _HookManager();