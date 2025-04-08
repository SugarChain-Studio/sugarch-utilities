/* eslint-disable @typescript-eslint/no-explicit-any */

import valid from 'semver/functions/valid';
import lt from 'semver/functions/lt';

export interface INamespace<T = any> {
    get(name: string, defaultValue: () => T): T;
    getMayOverride(name: string, defaultValue: OverrideFuncion<T>): T;
    set(name: string, value: T): void;
    has(name: string): boolean;
    delete(name: string): boolean;
}

/**
 * Access global variables safely in TypeScript
 * @param key - Key to access on globalThis
 */
function global<T = any> (key: string): T {
    return (globalThis as any)[key];
}

/**
 * Set a global variable safely in TypeScript
 * @param key - Key to set on globalThis
 * @param value - Value to set
 */
function setGlobal<T> (key: string, value: T): void {
    (globalThis as any)[key] = value;
}

/**
 * Function to override a value
 * @param old - Old value
 * @returns New value, if you don't want to override, return the old value
 */
type OverrideFuncion<T> = (old: T | undefined) => T;

export class Globals {
    /**
     * Namespace used to store global variables
     * @private
     */
    private static _namespace = '__BC_LUZI_GLOBALS__';

    /**
     * Initialize storage if it doesn't exist
     */
    private static _initStorage (): void {
        if (!global(this._namespace)) {
            setGlobal(this._namespace, {});
        }
    }

    /**
     * Get a global variable
     * @param name - Variable name
     * @param defaultValue - Default value
     */
    static get<T> (name: string, defaultValue: () => T): T {
        this._initStorage();
        const storage = global<Record<string, any>>(this._namespace);
        if (!(name in storage)) {
            storage[name] = defaultValue();
        }
        return storage[name];
    }

    /**
     * Get a global variable with ability to override
     * @param name - Variable name
     * @param defaultValue - Default value function that receives the old value
     */
    static getMayOverride<T> (name: string, defaultValue: OverrideFuncion<T>): T {
        this._initStorage();
        const storage = global<Record<string, any>>(this._namespace);
        storage[name] = defaultValue(storage[name]);
        return storage[name];
    }

    /**
     * Get a global variable with versioning support
     * @param name The name of the global variable
     * @param defaultOp When the global variable is not set, this function will be called to set the default value
     * @param upgradeOp When the global variable is set but the version is lower than the current version, this function will be called to upgrade the value
     * @returns The value of the global variable
     */
    static getByVersion<T> (
        name: string,
        version: string,
        defaultOp: OverrideFuncion<T>,
        upgradeOp: (version: string | undefined, value: T) => T
    ): T {
        this._initStorage();
        if (!valid(version)) {
            throw new Error(`Invalid version for ${name}: ${version}`);
        }
        const storage = global<Record<string, any>>(this._namespace);
        const versionName = `${name}.__Version`;

        const old = storage[name];
        const oldVersion = storage[versionName];

        if (!old) {
            storage[name] = defaultOp(old);
            storage[versionName] = version;
        } else {
            if (!oldVersion || lt(oldVersion, version)) {
                storage[name] = upgradeOp(oldVersion, old);
                storage[versionName] = version;
            }
        }
        return storage[name] as T;
    }

    /**
     * Set a global variable
     * @param name - Variable name
     * @param value - Variable value
     */
    static set<T> (name: string, value: T): void {
        this._initStorage();
        const storage = global<Record<string, any>>(this._namespace);
        storage[name] = value;
    }

    /**
     * Check if a variable exists
     * @param name - Variable name
     * @returns True if the variable exists
     */
    static has (name: string): boolean {
        this._initStorage();
        const storage = global<Record<string, any>>(this._namespace);
        return name in storage;
    }

    /**
     * Delete a variable
     * @param name - Variable name
     * @returns True if the variable existed and was deleted
     */
    static delete (name: string): boolean {
        this._initStorage();
        const storage = global<Record<string, any>>(this._namespace);
        if (name in storage) {
            return delete storage[name];
        }
        return false;
    }

    /**
     * Change implementation by replacing methods
     * @param implementation - Implementation that satisfies duck typing
     */
    static setImplementation (implementation: Partial<typeof Globals>): void {
        // Check if implementation meets requirements
        const requiredMethods = ['get', 'set', 'has', 'delete'] as const;

        for (const method of requiredMethods) {
            if (typeof implementation[method] !== 'function') {
                throw new Error(`Implementation must provide a '${method}' function`);
            }
            Globals[method] = implementation[method] as any;
        }
    }

    /**
     * Create a namespace
     * @param prefix - Namespace prefix
     */
    static createNamespace<T> (prefix: string): INamespace<T> {
        return {
            get: (name, defaultValue) => Globals.get<T>(`${prefix}.${name}`, defaultValue),
            getMayOverride: (name, defaultValue) => Globals.getMayOverride<T>(`${prefix}.${name}`, defaultValue),
            set: (name, value) => Globals.set<T>(`${prefix}.${name}`, value),
            has: name => Globals.has(`${prefix}.${name}`),
            delete: name => Globals.delete(`${prefix}.${name}`),
        };
    }
}
