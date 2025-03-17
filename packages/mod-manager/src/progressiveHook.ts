/**
 * Register a hook
 * @template {string} TFunctionName
 */
export class ProgressiveHook<TFunctionName extends string> {
    workList: ProgressiveHookInterface.WorkType<TFunctionName>[] = [];

    /**
     * @param {ModManagerInterface.HookableMod} hookMng
     */
    constructor (private hookMng: ModManagerInterface.HookableMod) {}

    /**
     * @param {ModManagerInterface.FunctionArguments<TFunctionName>} args
     * @param {ModManagerInterface.FunctionType<TFunctionName>} next
     * @returns {ModManagerInterface.FunctionReturnType<TFunctionName>}
     */
    run (
        args: ModManagerInterface.FunctionArguments<TFunctionName>,
        next: ModManagerInterface.FunctionType<TFunctionName>
    ): ModManagerInterface.FunctionReturnType<TFunctionName> {
        let hasResult = false;
        let result: ModManagerInterface.FunctionReturnType<TFunctionName> | undefined = undefined;
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

        if (hasResult) return result as ModManagerInterface.FunctionReturnType<TFunctionName>;
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
     * @param {ModManagerInterface.InjectFunction<TFunctionName>} func
     * @returns {this}
     */
    inject (func: ModManagerInterface.InjectFunction<TFunctionName>) {
        this.workList.push({ value: 'inject', work: func });
        return this;
    }

    /**
     * Require the next steps to be inside the specified function
     * @template {string} funcName
     * @param {funcName} func
     * @param {Object} config
     * @param {boolean} [config.once]
     * @param {number} [config.priority]
     * @returns {this}
     */
    inside (func: TFunctionName, { once = false, priority = 1 } = {}) {
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
     * @param {ModManagerInterface.CheckFunction<TFunctionName>} func
     * @returns {this}
     */
    when (func: ModManagerInterface.CheckFunction<TFunctionName>) {
        this.workList.push({ value: 'check', work: func });
        return this;
    }

    /**
     * Override the original function and use the return value as the Result. 
     * If the Result is set, next() will not be automatically called at the end.
     * @param {ModManagerInterface.HookFunction<TFunctionName>} func
     */
    override (func: ModManagerInterface.HookFunction<TFunctionName>) {
        this.workList.push({ value: 'override', work: func });
        return this;
    }
}
