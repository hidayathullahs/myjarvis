/**
 * Runtime Configuration
 * Defines environment flags and safety defaults for the application.
 * Ensures strict separation between DEBUG and PRODUCTION modes.
 */

// Detect mode from Vite env or default to production safety
const MODE = import.meta.env?.MODE || 'production';

export const RuntimeConfig = {
    MODE,
    IS_PRODUCTION: MODE === 'production',
    IS_DEVELOPMENT: MODE === 'development',

    // Feature Flags
    DEBUG_OVERLAY_DEFAULT: false, // Always off in prod
    STRESS_TOOLS_ENABLED: MODE !== 'production', // Disable stress tools in prod

    // Performance Guardrails
    MAX_FPS_TARGET: 60,
    SIMULATION_THROTTLE_MS: 16,

    // Privacy & Data Trust Defaults (Phase 6 Milestone 2)
    PERSISTENCE_ENABLED: false,      // Default: No local storage
    REMOTE_IO_ALLOWED: false,        // Default: No API uploads
    DEBUG_EXPORT_ENABLED: false,     // Default: No state dumps

    // Logging logic
    shouldLog: (level) => {
        if (MODE === 'production' && level === 'debug') return false;
        return true;
    }
};
