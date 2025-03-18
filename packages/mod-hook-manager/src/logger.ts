export interface ILogger {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}

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