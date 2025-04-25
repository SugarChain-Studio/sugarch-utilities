/**
 * A synchronous implementation of a Promise-like class.
 * This class provides a way to handle resolved or rejected values synchronously,
 * without the need for asynchronous operations.
 */
export class SyncPromise<T> {
    /**
     * Constructs a new SyncPromise instance.
     * @param fulfilled - Indicates whether the promise is fulfilled (true) or rejected (false).
     * @param value - The resolved value or rejection reason.
     */
    constructor(readonly fulfilled: boolean, readonly value: T | unknown) {}

    /**
     * Handles the resolved or rejected value of the SyncPromise.
     * @param onfulfilled - A callback function to handle the resolved value.
     * @param onrejected - (Optional) A callback function to handle the rejection reason.
     */
    then<U>(onfulfilled: (value: T) => U, onrejected?: (reason: unknown) => U): void {
        if (this.value !== undefined) {
            // If the value is defined, call the onfulfilled handler with the resolved value.
            onfulfilled(this.value as T);
        } else {
            // If the value is undefined, call the onrejected handler if provided.
            if (onrejected) {
                onrejected(this.value);
            } else {
                // Log an error if no rejection handler is provided.
                console.error('Promise rejected without handler', this.value);
            }
        }
    }

    /**
     * Creates a resolved SyncPromise with the given value.
     * @param value - The value to resolve the promise with.
     * @returns A new SyncPromise instance in the fulfilled state.
     */
    static resolve<U>(value: U): SyncPromise<U> {
        return new SyncPromise<U>(true, value);
    }

    /**
     * Creates a rejected SyncPromise with the given reason.
     * @param reason - The reason for rejecting the promise.
     * @returns A new SyncPromise instance in the rejected state.
     */
    static reject<U>(reason: unknown): SyncPromise<U> {
        return new SyncPromise<U>(false, reason);
    }
}
