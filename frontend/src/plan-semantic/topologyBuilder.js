/**
 * Topology Builder
 * Converts a list of Walls into a Connected Graph.
 * Identifies Nodes (Unique Corners) and Edges (Walls).
 */

export const TopologyBuilder = {
    /**
     * Build a connectivity graph from walls.
     * @param {Array} walls - ExtractionModels.Wall[]
     * @returns {Object} { nodes: [], edges: [] }
     */
    buildGraph: (walls) => {
        const nodes = []; // { id, x, y, neighbors: [] }
        const edges = []; // { id, from: nodeId, to: nodeId }

        // 1. Identify Unique Nodes (Endpoints) with spatial hashing/snap
        const SNAP_DIST = 5; // pixels

        const findOrAddNode = (x, y) => {
            let existing = nodes.find(n =>
                Math.hypot(n.x - x, n.y - y) < SNAP_DIST
            );

            if (existing) return existing;

            const newNode = {
                id: `node_${nodes.length}`,
                x, y,
                connectedWalls: []
            };
            nodes.push(newNode);
            return newNode;
        };

        // 2. Map Walls to Graph Edges
        walls.forEach(wall => {
            const startNode = findOrAddNode(wall.start.x, wall.start.y);
            const endNode = findOrAddNode(wall.end.x, wall.end.y);

            // Link node-to-wall
            startNode.connectedWalls.push(wall.id);
            endNode.connectedWalls.push(wall.id);

            // Create Edge (if not duplicate)
            edges.push({
                wallId: wall.id,
                from: startNode.id,
                to: endNode.id,
                length: Math.hypot(endNode.x - startNode.x, endNode.y - startNode.y)
            });
        });

        return { nodes, edges };
    }
};
