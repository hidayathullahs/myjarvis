/**
 * Mesh Builder
 * Orchestrates the conversion of Semantic Building Model -> Three.js Scene.
 */

import * as THREE from 'three';
import { WallMeshFactory } from './wallMeshFactory';
import { FloorMeshFactory } from './floorMeshFactory';

export const MeshBuilder = {
    /**
     * Build the full 3D group for a building model.
     * @param {Object} buildingModel - Semantic Building Model
     * @returns {THREE.Group}
     */
    build: (buildingModel) => {
        const group = new THREE.Group();
        group.name = 'BuildingReconstruction';

        // Config defaults
        const config = {
            height: 2.8, // meters (standard ceiling)
            pixelsPerMeter: buildingModel.floors[0]?.scale?.pixelsPerMeter || 50
        };

        // Iterate Config
        buildingModel.floors.forEach(floor => {
            const floorGroup = new THREE.Group();
            floorGroup.name = `Floor_${floor.level}`;

            // 1. Walls
            floor.walls.forEach(wallId => {
                // We need to resolve ID to object. 
                // Currently SemanticModel stores walls in a flat list on the Floor or Building?
                // The Schema said walls: [] on Floor. Assuming these are full objects or we lookup.
                // If IDs, we need a lookup map. For now, assuming embedded objects for simplicity of this builder.
                // Revisit Schema: "walls: [], // Reference to all walls on this floor"
                // Let's assume the passed model has resolved objects or we find them.

                // TEMP: Assuming passed `floor.walls` contains the Wall Objects for the demo flow.
            });

            // NOTE: The previous milestone Schema defined walls/rooms as IDs or Arrays.
            // A production builder accepts a fully hydrated model.
            // We will iterate assuming they are objects.
        });

        return group;
    },

    /**
     * Simple Direct Builder (For testing with direct arrays)
     */
    buildFromLists: (walls, rooms, config = {}) => {
        const group = new THREE.Group();
        const cfg = {
            height: 2.8,
            pixelsPerMeter: 50,
            ...config
        };

        walls.forEach(wall => {
            const mesh = WallMeshFactory.create(wall, cfg);
            if (mesh) group.add(mesh);
        });

        rooms.forEach(room => {
            const mesh = FloorMeshFactory.create(room);
            if (mesh) {
                // Fix orientation for FloorFactory which returns geometry rotated
                // Actually FloorFactory rotates geometry, let's keep consistency.
                // FloorFactory method logic: geometry.rotateX(Math.PI / 2). 
                // So (x,y) -> (x, z, -y)? 
                // Shape (x,y) -> Extrude (x,y,z).
                // Let's refine FloorFactory usage:

                // ShapeGeometry is (x,y). RotateX(-PI/2) -> (x, 0, y) effectively X/Z plane.
                mesh.rotation.x = -Math.PI / 2;
                group.add(mesh);
            }
        });

        return group;
    }
};
