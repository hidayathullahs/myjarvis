import { SystemLog, LOG_TYPES } from './systemLog';

const SCHEMA_VERSION = 1;

/**
 * Creates a safe, sanitized snapshot of the current session.
 * Explicitly excludes raw assets (Buffers, Blobs, Files).
 */
export function createSessionSnapshot({
    twinState,
    modelStats, // Semantic Model Metadata
    uiState,
    simulationConfig
}) {
    SystemLog.info(LOG_TYPES.SYSTEM, `Creating Session Snapshot v${SCHEMA_VERSION}`);

    // 1. Sanitize Twin State (Deep copy + allowlist)
    const safeTwinState = {
        risk: twinState.risk ? { ...twinState.risk } : {},
        telemetry: twinState.telemetry ? { ...twinState.telemetry } : {},
        // DO NOT SAVE: raw sensor buffers or huge arrays
    };

    // 2. Sanitize Model Stats
    const safeModelStats = modelStats ? {
        size: modelStats.size,
        scale: modelStats.scale,
        polyCount: modelStats.polyCount,
        // DO NOT SAVE: raw geometry buffers
    } : null;

    // 3. Construct Payload
    const snapshot = {
        schema_version: SCHEMA_VERSION,
        timestamp: new Date().toISOString(),
        meta: {
            app_version: '1.0.0', // Could import from package.json
            user_agent: navigator.userAgent
        },
        data: {
            twin_state: safeTwinState,
            model_stats: safeModelStats,
            ui_state: {
                theme: uiState?.theme || 'default',
                mode: uiState?.mode || 'view',
                // Exclude ephemeral UI flags (isSpeaking, etc)
            },
            simulation_config: simulationConfig || {}
        }
    };

    return JSON.stringify(snapshot, null, 2);
}

/**
 * Restores a session from a JSON string.
 * Validates schema and sanitizes input.
 */
export function restoreSession(jsonString) {
    try {
        const snapshot = JSON.parse(jsonString);

        // 1. Schema Validation
        if (!snapshot.schema_version) {
            throw new Error("Invalid Session File: Missing Schema Version");
        }
        if (snapshot.schema_version !== SCHEMA_VERSION) {
            SystemLog.warn(LOG_TYPES.SYSTEM, `Schema Mismatch: File v${snapshot.schema_version}, App v${SCHEMA_VERSION}. Attempting migration...`);
            // Future: Migration logic
        }

        SystemLog.info(LOG_TYPES.SYSTEM, "Restoring Session State...", { timestamp: snapshot.timestamp });

        // 2. Extract Data
        const { data } = snapshot;

        // 3. Return Hydrated State Objects for App to consume
        return {
            success: true,
            twinState: data.twin_state,
            modelStats: data.model_stats,
            uiState: data.ui_state,
            simulationConfig: data.simulation_config
        };

    } catch (e) {
        SystemLog.error(LOG_TYPES.SYSTEM, `Session Restore Failed: ${e.message}`);
        return { success: false, error: e.message };
    }
}

/**
 * Trigger a browser download of the session file.
 */
export function downloadSessionFile(jsonString, filename = 'jarvis_session.json') {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    SystemLog.info(LOG_TYPES.SYSTEM, "Session File Exported");
}
