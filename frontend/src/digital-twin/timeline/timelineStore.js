/**
 * Timeline Store (The Flight Recorder)
 * Maintains a rolling buffer of Twin State summaries for temporal analysis.
 * 
 * Storage Policy:
 * - Sampling Rate: ~200ms (5Hz)
 * - Window Size: 30 seconds (~150 samples)
 * - Data: Compressed state summaries (Risk, Confidence, Zones). NO RAW GEOMETRY.
 */

const MAX_SAMPLES = 150; // 30s @ 5Hz

// In-memory buffer (outside React state for performance, exposed via getters)
let historyBuffer = [];

export const TimelineStore = {
    /**
     * Add a snapshot to the timeline.
     * @param {Object} twinState - Full Twin State
     */
    addSnapshot: (twinState) => {
        const snapshot = {
            timestamp: Date.now(),
            risk: {
                level: twinState.risk.level,
                score: twinState.risk.score || 0 // Assuming risk model adds numeric score later
            },
            confidence: twinState.confidence.value,
            zonal: {
                criticalCount: twinState.risk.zonal ? twinState.risk.zonal.roomsAtRisk : 0,
                // store IDs of critical rooms for recurrence detection
                criticalRooms: twinState.risk.zonal ? twinState.risk.zonal.criticalRooms : []
            },
            telemetry: {
                slicing: twinState.clipping.enabled,
                mode: twinState.ui.mode
            }
        };

        historyBuffer.push(snapshot);

        if (historyBuffer.length > MAX_SAMPLES) {
            historyBuffer.shift(); // Remove oldest
        }
    },

    /**
     * Get the last N seconds of history.
     * @param {number} seconds 
     * @returns {Array} List of snapshots
     */
    getHistory: (seconds = 10) => {
        const now = Date.now();
        const cutoff = now - (seconds * 1000);
        return historyBuffer.filter(s => s.timestamp >= cutoff);
    },

    /**
     * Get the full buffer.
     */
    getAll: () => [...historyBuffer],

    /**
     * Clear history (e.g., on model load).
     */
    clear: () => {
        historyBuffer = [];
    }
};
