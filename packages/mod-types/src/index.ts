export * from "./assets";
export * from "./translation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FuncWork<T extends any[] = []> = (...args: T) => void;