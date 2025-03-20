import { ILogger } from "@sugarch/bc-mod-types";

let staticLogger: ILogger | undefined = undefined;

export function setLogger(logger: ILogger) {
    staticLogger = logger;
}

export class Logger {
    static info(message: string) {
        staticLogger?.info(message);
    }
    static warn(message: string) {
        staticLogger?.warn(message);
    }
    static error(message: string) {
        staticLogger?.error(message);
    }
}