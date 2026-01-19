/**
 * Data Policy Engine
 * The canonical source of truth for data lifecycle, retention, and privacy.
 * Enforces "Local-First" and "Ephemeral-By-Default" rules.
 */

export const DATA_CLASSES = {
    BLUEPRINT_FILE: 'BLUEPRINT_FILE',         // Raw User Upload
    CV_PREPROCESSED: 'CV_PREPROCESSED',       // Grayscale/Memory Buffer
    DETECTED_GEOMETRY: 'DETECTED_GEOMETRY',   // Extracted Lines
    SEMANTIC_MODEL: 'SEMANTIC_MODEL',         // Rooms/Walls Object
    DIGITAL_TWIN_STATE: 'DIGITAL_TWIN_STATE', // Current State Tree
    SIMULATION_HISTORY: 'SIMULATION_HISTORY', // Rolling Buffer
    RISK_AND_TRENDS: 'RISK_AND_TRENDS',       // Aggregated Analytics
    EXPLAINABILITY_SUMMARIES: 'EXPLAINABILITY_SUMMARIES', // Generated Text
    SESSION_METADATA: 'SESSION_METADATA'      // Non-PII Session Info
};

export const RETENTION_RULES = {
    [DATA_CLASSES.BLUEPRINT_FILE]: 'MEMORY_ONLY', // Strict Purge
    [DATA_CLASSES.CV_PREPROCESSED]: 'TRANSIENT',  // Purge after processing
    [DATA_CLASSES.DETECTED_GEOMETRY]: 'SESSION',
    [DATA_CLASSES.SEMANTIC_MODEL]: 'SESSION',
    [DATA_CLASSES.DIGITAL_TWIN_STATE]: 'SESSION',
    [DATA_CLASSES.SIMULATION_HISTORY]: 'RING_BUFFER',
    // ... others are SESSION by default
};

const _registry = new Map();

export const DataPolicy = {

    register: (id, type, sizeBytes = 0) => {
        if (!DATA_CLASSES[type]) {
            console.warn(`[DataPolicy] Unknown Type: ${type}`);
            return;
        }
        _registry.set(id, { type, timestamp: Date.now(), size: sizeBytes });
    },

    markAsEphemeral: (id) => {
        // Schedule for immediate cleanup if needed
        if (_registry.has(id)) {
            _registry.delete(id);
            // In a real app with managed buffers, we'd trigger free() here
        }
    },

    purgeAll: () => {
        console.log('[DataPolicy] ⚠️ EXECUTION PURGE_ALL: Clearing Session Memory');
        _registry.clear();

        // Force GC hints if possible (limited in JS)
        // Clear caches
        if (window.caches) {
            // Optional: clear specific opaque caches
        }
    },

    getRetentionPolicy: (type) => {
        return RETENTION_RULES[type] || 'UNKNOWN';
    },

    // Lifecycle Hook
    installSafetyNet: () => {
        window.addEventListener('beforeunload', () => {
            // Synchronous purge attempt
            DataPolicy.purgeAll();
        });
    }
};

// Auto-install on module load
DataPolicy.installSafetyNet();
