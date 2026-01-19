/**
 * Digital Twin State Model
 * The canonical source of truth for the system's understanding of reality.
 * Pure data. No class instances. Serializable.
 */

export const INITIAL_TWIN_STATE = {
    meta: {
        version: '1.0.0',
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        sessionId: null
    },

    model: {
        id: null,
        name: null,
        boundingBox: {
            min: { x: 0, y: 0, z: 0 },
            max: { x: 0, y: 0, z: 0 }
        },
        dimensions: { x: 0, y: 0, z: 0 },
        scale: 1,
        loaded: false,
        buildingModel: null // Semantic Data (Rooms, Floors)
    },

    clipping: {
        enabled: false,
        activeAxis: null, // 'x' | 'y' | 'z'
        planes: {
            horizontal: { active: false, offset: 0, inverted: false },
            vertical: { active: false, offset: 0, inverted: false }
        }
    },

    measurements: {
        active: false,
        points: [], // [{x,y,z}, {x,y,z}]
        distance: null
    },

    risk: {
        level: 'stable', // stable | advisory | warning | critical
        drivers: [] // ['high_latency', 'manual_slicing']
    },

    confidence: {
        value: 1.0, // 0.0 - 1.0
        drivers: [] // ['stable_sensors', 'known_geometry']
    },

    ui: {
        mode: 'view', // view | measure | slice
        focus: null
    },

    simulation: {
        lastRun: null,
        prediction: null
    },

    history: [] // Traceability log
};
