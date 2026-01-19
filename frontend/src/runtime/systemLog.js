/**
 * System Logger
 * OPERATIONAL logging only. NO PII. NO USER CONTENT. NO PATHS.
 * 
 * Allowed: Risk transitions, performance metrics, error codes, phase changes.
 * Forbidden: File names, raw input text, image buffers.
 */

import { RuntimeConfig } from './runtimeConfig';

export const LOG_LEVELS = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG'
};

export const LOG_TYPES = {
    SYSTEM: 'SYSTEM',
    RISK_CHANGE: 'RISK_CHANGE',
    SIMULATION: 'SIMULATION',
    CV_EVENT: 'CV_EVENT',
    LIFECYCLE: 'LIFECYCLE'
};

const _history = []; // Volatile memory log for debug overlay
const MAX_HISTORY = 100;

export const SystemLog = {

    info: (type, detail) => SystemLog.record(LOG_LEVELS.INFO, type, detail),
    warn: (type, detail) => SystemLog.record(LOG_LEVELS.WARN, type, detail),
    error: (type, detail) => SystemLog.record(LOG_LEVELS.ERROR, type, detail),
    debug: (type, detail) => SystemLog.record(LOG_LEVELS.DEBUG, type, detail),

    record: (level, type, detail) => {
        // 1. Check Filters
        if (!RuntimeConfig.shouldLog(level.toLowerCase())) return;

        // 2. Structure
        const entry = {
            ts: new Date().toISOString(),
            level,
            type,
            detail: typeof detail === 'string' ? { message: detail } : detail
        };

        // 3. Console Output (Calm format)
        const prefix = `[${type}]`;
        if (level === LOG_LEVELS.ERROR) console.error(prefix, detail);
        else if (level === LOG_LEVELS.WARN) console.warn(prefix, detail);
        else console.log(prefix, detail);

        // 4. Volatile History (for HUD debugging)
        _history.unshift(entry);
        if (_history.length > MAX_HISTORY) _history.pop();
    },

    getRecent: (count = 10) => {
        return _history.slice(0, count);
    },

    flush: () => {
        _history.length = 0;
    }
};
