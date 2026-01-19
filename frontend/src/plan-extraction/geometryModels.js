/**
 * Geometry Extraction Models
 * Schemas for the output of the CV Extraction Pipeline.
 * 
 * Flow: Raw Lines (CV) -> Merged Segments -> Semantic Walls -> 3D Mesh
 */

export const ExtractionModels = {
    // 1. Raw Detection (from OpenCV/Hough)
    LineSegment: {
        x1: 0, y1: 0,
        x2: 0, y2: 0,
        confidence: 0, // 0-1
        type: 'unknown' // 'wall' | 'opening' | 'symbol'
    },

    // 2. Semantic Primitives (Output of Assembler)
    Wall: {
        id: null, // UUID
        start: { x: 0, y: 0 },
        end: { x: 0, y: 0 },
        thickness: 0.2, // meters (default)
        confidence: 1.0,
        material: 'generic',
        connectedTo: [] // IDs of other walls
    },

    Opening: {
        id: null,
        type: 'door', // 'door' | 'window' | 'gap'
        center: { x: 0, y: 0 },
        width: 1.0,
        orientation: 0, // radians
        wallId: null // Host wall
    },

    // 3. Final Result Object
    ExtractionResult: {
        timestamp: 0,
        predictionId: null,
        walls: [],
        openings: [],
        meta: {
            scale: 1.0, // pixels per meter
            uncertainty: 0.0,
            sourceImageId: null
        }
    }
};
