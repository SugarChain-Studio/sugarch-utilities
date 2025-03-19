import { Logger } from "./logger";

// Define a type for work functions
type FuncWork = () => void;

const registerQueue: FuncWork[] = [];
let queueLoaded = false;

/**
 * Add a function to the load queue or execute it immediately if the queue has already been processed
 * @param fn - Function to execute
 */
export function pushLoad(fn: FuncWork): void {
    if (!queueLoaded) registerQueue.push(fn);
    else fn();
}

/**
 * Set up and process all functions in the load queue
 * @param options - Configuration options
 */
export function setupLoad(options: {
    startMsg?: string;
    endMsg?: string;
} = {}): void {
    const { 
        startMsg = "Start loading", 
        endMsg = "Loading completed, time usage: " 
    } = options;
    
    const start = Date.now();
    Logger.info(startMsg);
    
    queueLoaded = true;
    while (registerQueue.length > 0) {
        const fn = registerQueue.shift();
        if (fn) fn();
    }
    
    const end = Date.now();
    Logger.info(`${endMsg} ${end - start}ms`); // Fixed the time calculation
}