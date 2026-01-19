/**
 * Digital Twin Mutations
 * Explicit, deterministic functions to modify the Twin State.
 * Includes history logging for traceability.
 */

import { INITIAL_TWIN_STATE } from './twinState';

// Helper to clone state safely
const clone = (state) => JSON.parse(JSON.stringify(state));

// Helper to push logic to history
const logChange = (state, type, details, actor = 'system') => {
    state.meta.lastUpdated = Date.now();

    // Prune history if too long (e.g. 50 entries)
    if (state.history.length > 50) state.history.shift();

    state.history.push({
        ts: Date.now(),
        type,
        actor,
        details
    });
};

export const TwinMutations = {
    // --- Lifecycle ---
    initSession: (state, sessionId) => {
        const next = clone(state);
        next.meta.sessionId = sessionId;
        logChange(next, 'SESSION_INIT', { sessionId });
        return next;
    },

    // --- Model Data ---
    setModelData: (state, { id, name, boundingBox, dimensions, scale }) => {
        const next = clone(state);
        next.model = { ...next.model, id, name, boundingBox, dimensions, scale, loaded: true };
        logChange(next, 'MODEL_LOADED', { name, id });
        return next;
    },

    // --- Clipping / Slicing ---
    setClippingState: (state, { enabled, activeAxis, planes }) => {
        const next = clone(state);
        next.clipping.enabled = enabled;
        if (activeAxis !== undefined) next.clipping.activeAxis = activeAxis;
        if (planes) next.clipping.planes = { ...next.clipping.planes, ...planes };

        logChange(next, 'CLIPPING_UPDATE', { enabled, axis: activeAxis });
        return next;
    },

    updatePlaneOffset: (state, type, offset) => {
        const next = clone(state);
        if (next.clipping.planes[type]) {
            next.clipping.planes[type].offset = offset;
            // No deep log for slider drag to avoid spam, or debounce at telemetry layer
        }
        return next;
    },

    // --- Measurements ---
    setMeasurementPoints: (state, points) => {
        const next = clone(state);
        next.measurements.points = points;
        // Auto-calc distance if 2 points
        if (points.length === 2 && points[0] && points[1]) {
            const dx = points[0].x - points[1].x;
            const dy = points[0].y - points[1].y;
            const dz = points[0].z - points[1].z;
            next.measurements.distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            logChange(next, 'MEASUREMENT_COMPLETE', { distance: next.measurements.distance });
        } else {
            next.measurements.distance = null;
        }
        return next;
    },

    // --- Risk & Confidence ---
    setRiskLevel: (state, level, drivers = []) => {
        const next = clone(state);
        if (next.risk.level !== level) {
            next.risk.level = level;
            next.risk.drivers = drivers;
            logChange(next, 'RISK_CHANGE', { level, drivers });
        }
        return next;
    },

    setConfidence: (state, value) => {
        const next = clone(state);
        next.confidence.value = Math.max(0, Math.min(1, value)); // Clamp 0-1
        return next;
    },

    // --- UI Context ---
    setToolMode: (state, mode) => {
        const next = clone(state);
        if (next.ui.mode !== mode) {
            next.ui.mode = mode;
            logChange(next, 'TOOL_MODE_CHANGE', { mode });
        }
        return next;
    }
};
