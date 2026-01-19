/**
 * Semantic Building Model
 * The high-level architectural representation of the extracted geometry.
 * 
 * Hierarchy: Building -> Floors -> Rooms -> Walls/Openings
 */

export const SemanticModels = {
    Building: {
        id: null,
        name: 'New Building',
        floors: [],
        meta: {
            created: 0,
            sourcePlanId: null,
            totalArea: 0
        }
    },

    Floor: {
        id: null,
        level: 0, // 0 = Ground
        elevation: 0, // meters
        rooms: [],
        walls: [], // Reference to all walls on this floor
        openings: [],
        scale: {
            pixelsPerMeter: 50, // default placeholder
            confidence: 0.5
        }
    },

    Room: {
        id: null,
        name: 'Room', // 'Kitchen', 'Bedroom', etc. (Future: AI Labeling)
        type: 'generic',
        polygon: [], // [{x,y}, ...] ordered vertices
        area: 0, // sq meters
        walls: [], // IDs of bounding walls
        openings: [], // IDs of doors/windows in this room
        center: { x: 0, y: 0 },
        confidence: 1.0
    },

    // Topology Nodes for Graph
    Node: {
        id: null,
        x: 0, y: 0,
        connectedWalls: [] // IDs
    }
};
