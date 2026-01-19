/**
 * Room Detector
 * Identifies closed loops (cycles) in the Topology Graph to detect Rooms.
 */

export const RoomDetector = {
    /**
     * Detect rooms from the connectivity graph.
     * @param {Object} graph - { nodes, edges } output from TopologyBuilder
     * @returns {Array} SemanticModels.Room[]
     */
    detectRooms: (graph) => {
        const rooms = [];
        // Cycle detection logic requires traversing the graph.
        // For Milestone 3 Delivery, we implement a simplified "Minimum Cycle Basis"
        // or a mock that returns the bounding polygon if the graph is simple.

        // TODO: Implement full Left-Hand Rule or planar graph face extraction.

        // --- MOCK LOGIC for Scaffolding ---
        // Assuming a single closed loop for the MVP 'MockDetector' rect
        if (graph.nodes.length >= 4 && graph.edges.length >= 4) {
            const poly = graph.nodes.map(n => ({ x: n.x, y: n.y }));

            // Calculate Area (Shoelace Formula)
            let area = 0;
            for (let i = 0; i < poly.length; i++) {
                let j = (i + 1) % poly.length;
                area += poly[i].x * poly[j].y;
                area -= poly[j].x * poly[i].y;
            }
            area = Math.abs(area) / 2;

            rooms.push({
                id: `room_${Date.now()}`,
                name: 'Detected Room',
                type: 'generic',
                polygon: poly,
                area: area,
                center: calculateCentroid(poly),
                confidence: 0.9,
                walls: graph.edges.map(e => e.wallId)
            });
        }

        return rooms;
    }
};

// Helper
const calculateCentroid = (points) => {
    let x = 0, y = 0;
    points.forEach(p => { x += p.x; y += p.y; });
    return { x: x / points.length, y: y / points.length };
};
