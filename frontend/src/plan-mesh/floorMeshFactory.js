/**
 * Floor Mesh Factory
 * Generates Three.js Geometry for Rooms (Floors).
 */

import * as THREE from 'three';

export const FloorMeshFactory = {
    /**
     * Create a mesh for a room floor.
     * @param {Object} room - Semantic Room Object
     * @returns {THREE.Mesh}
     */
    create: (room) => {
        if (!room.polygon || room.polygon.length < 3) return null;

        // 1. Create a Shape
        const shape = new THREE.Shape();
        const start = room.polygon[0];
        shape.moveTo(start.x, start.y);

        for (let i = 1; i < room.polygon.length; i++) {
            const p = room.polygon[i];
            shape.lineTo(p.x, p.y);
        }
        shape.closePath();

        // 2. Geometry
        const geometry = new THREE.ShapeGeometry(shape);
        // Rotate to lie flat on X/Z plane
        geometry.rotateX(Math.PI / 2);

        // 3. Material
        const material = new THREE.MeshBasicMaterial({
            color: 0x202020,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { id: room.id, type: 'floor', name: room.name };

        // Align Y (height)
        mesh.position.y = 0.05; // Slightly above zero to avoid z-fighting with grid

        // Align X/Z (The ShapeGeometry uses X/Y by default before rotation)
        // After rotateX(90), Y becomes Z, -Z becomes Y.
        // Actually typically easier: Shape in X/Y -> Mesh.rotation.x = -Math.PI / 2.

        return mesh;
    }
};
