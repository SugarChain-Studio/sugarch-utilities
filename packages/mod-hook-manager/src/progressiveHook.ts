import { HookManagerInterface, ProgressiveHookInterface } from "./types";

/**
 * Register a hook
 */
export class ProgressiveHook<TFunctionName extends string> {
    workList: ProgressiveHookInterface.WorkType<TFunctionName>[] = [];

    /**
     * @param hookMng
     */
    constructor (private hookMng: HookManagerInterface.HookableMod) {}

    run (
        args: HookManagerInterface.FunctionArguments<TFunctionName>,
        next: HookManagerInterface.FunctionType<TFunctionName>
    ): HookManagerInterface.FunctionReturnType<TFunctionName> {
        let hasResult = false;
        let result: HookManagerInterface.FunctionReturnType<TFunctionName> | undefined = undefined;
        for (const work of this.workList) {
            if (work.value === 'inject') {
                work.work(args, next);
            } else if (work.value === 'next') {
                result = next(args);
                hasResult = true;
            } else if (work.value === 'override') {
                result = work.work(args, next);
                hasResult = true;
            } else if (work.value === 'flag') {
                if (!work.flag) break;
                if (work.once) work.flag = false;
            } else if (work.value === 'check') {
                if (!work.work(args, next)) break;
            }
        }

        if (hasResult) return result as HookManagerInterface.FunctionReturnType<TFunctionName>;
        else return next(args);
    }

    /**
     * Add the next step, as if executing the original function, and set the Result. 
     * If the Result is set, next() will not be automatically called at the end.
     */
    next () {
        this.workList.push({ value: 'next' });
        return this;
    }

    /**
     * Add an injection step, where you can modify parameters or produce other side effects. 
     * Note that this step will not set the Result, and next() will be automatically called at the end of the step.
     * @param func
     * @returns
     */
    inject (func: HookManagerInterface.InjectFunction<TFunctionName>) {
        this.workList.push({ value: 'inject', work: func });
        return this;
    }

    /**
     * Require the next steps to be inside the specified function
     * @param func inside function name
     * @param config 
     * @param config.once only run once (reset count for each inside function call) 
     * @param config.priority hook priority
     * @returns
     */
    inside<UFunctionName extends string>(func: UFunctionName, { once = false, priority = 1 } = {}) {
        const flag: ProgressiveHookInterface.FlagWork<TFunctionName> = { value: 'flag', flag: false, once };

        this.hookMng.hookFunction(func, priority, (args, next) => {
            flag.flag = true;
            const ret = next(args);
            flag.flag = false;
            return ret;
        });

        this.workList.push(flag);
        return this;
    }

    /**
     * Add a check step, if it returns false, stop executing subsequent steps.
     * @param func
     * @returns
     */
    when (func: HookManagerInterface.CheckFunction<TFunctionName>) {
        this.workList.push({ value: 'check', work: func });
        return this;
    }

    /**
     * Override the original function and use the return value as the Result. 
     * If the Result is set, next() will not be automatically called at the end.
     * @param func
     */
    override (func: HookManagerInterface.HookFunction<TFunctionName>) {
        this.workList.push({ value: 'override', work: func });
        return this;
    }
}
