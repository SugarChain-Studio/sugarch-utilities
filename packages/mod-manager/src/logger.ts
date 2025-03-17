export class DefaultLogger {
    static info(message: string) {
        console.log("[@sugarch/bc-mod-manager]", message);
    }
    static warn(message: string) {
        console.warn("[@sugarch/bc-mod-manager]", message);
    }
    static error(message: string) {
        console.error("[@sugarch/bc-mod-manager]", message);
    }
}

let _Logger = DefaultLogger;

export function setLogger(logger: typeof DefaultLogger) {
    _Logger = logger;
}

export class Logger {
    static info(message: string) {
        Logger.info(message);
    }
    static warn(message: string) {
        Logger.warn(message);
    }
    static error(message: string) {
        Logger.error(message);
    }
}