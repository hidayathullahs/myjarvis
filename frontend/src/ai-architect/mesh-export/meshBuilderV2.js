/**
 * @fileoverview Mesh Extruder V2
 * Converts Concept Layout -> 3D Three.js Object Group (Hologram Ready)
 */

import * as THREE from 'three';

export class MeshExtruder {

    constructor() {
        this.materialWall = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        this.materialFloor = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
        this.wallHeight = 3.0; // Meters
        this.wallThickness = 0.2; // Width offset
    }

    /**
     * Builds a scene group from the layout
     * @param {Object} layout - Constraint Solver Output
     * @returns {THREE.Group}
     */
    build(layout) {
        const group = new THREE.Group();

        // 1. Base Slab
        const slabGeom = new THREE.BoxGeometry(layout.width, 0.2, layout.length);
        const slab = new THREE.Mesh(slabGeom, this.materialFloor);
        slab.position.set(layout.width / 2, -0.1, layout.length / 2);
        group.add(slab);

        // 2. Extrude Rooms
        layout.rooms.forEach(room => {
            this._buildRoomWalls(room, group);
        });

        // 3. Metadata for Explainability
        group.userData = {
            generatedBy: 'AI Architect v1.0',
            timestamp: Date.now(),
            efficiency: layout.efficiency
        };

        return group;
    }

    _buildRoomWalls(room, parentGroup) {
        // Simplified Extrusion: Create 4 walls for the room rect
        // In real app, we'd boolean union these to avoid overlap, but for MVP separate meshes work.

        const x = room.x;
        const y = room.y;
        const w = room.width;
        const l = room.length;
        const h = this.wallHeight;
        const t = this.wallThickness;

        // Wall 1 (Top)
        const w1 = new THREE.Mesh(new THREE.BoxGeometry(w + t, h, t), this.materialWall);
        w1.position.set(x + w / 2, h / 2, y);
        parentGroup.add(w1);

        // Wall 2 (Bottom)
        const w2 = new THREE.Mesh(new THREE.BoxGeometry(w + t, h, t), this.materialWall);
        w2.position.set(x + w / 2, h / 2, y + l);
        parentGroup.add(w2);

        // Wall 3 (Left)
        const w3 = new THREE.Mesh(new THREE.BoxGeometry(t, h, l - t), this.materialWall);
        w3.position.set(x, h / 2, y + l / 2);
        parentGroup.add(w3);

        // Wall 4 (Right)
        const w4 = new THREE.Mesh(new THREE.BoxGeometry(t, h, l - t), this.materialWall);
        w4.position.set(x + w, h / 2, y + l / 2);
        parentGroup.add(w4);

        // Floor
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, l), this.materialFloor);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(x + w / 2, 0.01, y + l / 2); // slightly above slab
        parentGroup.add(floor);
    }
}
