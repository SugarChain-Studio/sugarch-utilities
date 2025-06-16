/**
 * @param {string} packageName - package name
 * @param {string} version - package version
 * @returns {string} - formatted banner string
 */
export function createBanner(packageName, version) {
    return `/**
 * ${packageName} v${version}
 * 
 * Copyright (c) ${new Date().getFullYear()} SugarChain Studio
 * License: MIT
 * https://github.com/SugarChain-Studio/sugarch-utilities
 * @preserve
 */
`;
  }