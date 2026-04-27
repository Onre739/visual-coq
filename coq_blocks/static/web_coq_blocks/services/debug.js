const DEBUG = false;

export function debugLog(...args) {
    if (DEBUG) console.log(...args);
}

export function debugWarn(...args) {
    if (DEBUG) console.warn(...args);
}

export function debugError(...args) {
    if (DEBUG) console.error(...args);
}
