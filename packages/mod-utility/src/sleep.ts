/**
 * You must sleep for a while
 * @param ms milliseconds
 */
export function sleepFor(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Thou shalt slumber in code's bosom until the condition doth manifest
 * @param test test condition
 * @param interval interval time
 */
export function sleepUntil(test: () => boolean, interval = 100): Promise<void> {
    return (async () => {
        while (!test()) await sleepFor(interval);
    })();
}