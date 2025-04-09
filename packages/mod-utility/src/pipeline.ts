import { Globals } from "./globals";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyFunc = (...args: any[]) => any;

export class FunctionPipeline<F extends AnyFunc> {
    private functions: ((acc: ReturnType<F>, ...args: Parameters<F>) => ReturnType<F>)[] = [];
    private _globalFuncName: string;

    /**
     * The name of the global lambda function.
     */
    public get globalFuncName(): string {
        return this._globalFuncName;
    }

    /**
     * Constructor to initialize the pipeline and set the global function name.
     * @param prefix - The prefix for the global lambda function name.
     * @param defaultFunc - A default function to initialize the pipeline, used when acc is undefined.
     */
    constructor(prefix: string, defaultFunc: (...args: Parameters<F>) => ReturnType<F>) {
        this._globalFuncName = `${prefix}_${Math.random().toString(16).substring(2)}`;
        this.functions.push((_, ...args) => defaultFunc(...args));

        /* eslint-disable @typescript-eslint/no-explicit-any */
        (globalThis as any)[this._globalFuncName] = (...args: Parameters<F>) => this.run(...args);
    }

    /**
     * Registers a new function into the pipeline.
     * @param func - A function of the form (acc, ...args) => T.
     * @returns The current pipeline instance for chaining.
     */
    public register(func: (acc: ReturnType<F>, ...args: Parameters<F>) => ReturnType<F>): this {
        this.functions.push(func);
        return this; // Enable chaining
    }

    /**
     * Executes the pipeline with the given arguments.
     * @param args - The arguments to pass to the pipeline functions.
     * @returns The final result after all functions in the pipeline are executed.
     */
    public run(...args: Parameters<F>): ReturnType<F> {
        let acc: ReturnType<F> = undefined as any; // Initial accumulator value
        for (const func of this.functions) {
            acc = func(acc, ...args);
        }
        return acc;
    }
}

/**
 * Creates or retrieves a global pipeline instance.
 * If the pipeline does not exist, it will be created with the specified default function.
 * 
 * @param name - The unique name of the pipeline.
 * @param defaultFunc - The default function to initialize the pipeline.
 * @returns The pipeline instance.
 */
export function globalPipeline<F extends AnyFunc>(name: string, defaultFunc: F, onNewlyCreated?: (pipeline: FunctionPipeline<F>) => void): FunctionPipeline<F> {
    return Globals.get(name, () => {
        const pipeline = new FunctionPipeline(name, defaultFunc);
        onNewlyCreated?.(pipeline);
        return pipeline;
    });
}