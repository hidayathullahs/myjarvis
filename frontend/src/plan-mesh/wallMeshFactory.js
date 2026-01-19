/**
 * Wall Mesh Factory
 * Generates Three.js Geometry for Semantic Walls.
 */

import * as THREE from 'three';

export const WallMeshFactory = {
    /**
     * Create a mesh for a single wall.
     * @param {Object} wall - Semantic Wall Object
     * @param {Object} config - { height, pixelsPerMeter }
     * @returns {THREE.Mesh}
     */
    create: (wall, config) => {
        const { height, pixelsPerMeter } = config;

        // 1. Calculate Dimensions (in WebGL units)
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const lengthPx = Math.hypot(dx, dy);

        // Convert to World Units (Meters)
        // Note: Our Scene might be scaled to fit, so this depends on how we normalize.
        // Option A: Build in 'Meters' and scale the group.
        // Option B: Build in 'Pixels' and trust the viewer to scale.
        // Let's stick to Pixels for generic alignment to the image, then scaling the parent group.

        const thicknessPx = wall.thickness * pixelsPerMeter;
        const heightPx = height * pixelsPerMeter;

        // 2. Geometry
        const geometry = new THREE.BoxGeometry(lengthPx, heightPx, thicknessPx);
        // Translate to pivot from start? Or box center.
        // BoxGeometry is centered at (0,0,0).

        // 3. Material
        const material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { id: wall.id, type: 'wall' };

        // 4. Position & Rotation
        // Center of the wall segment
        const cx = (wall.start.x + wall.end.x) / 2;
        const cy = (wall.start.y + wall.end.y) / 2;

        // Z is up in our semantic logic usually, but Three.js Y is up.
        // If Plan is X/Y, then Height is Z.
        // Let's assume standard 3D: X/Z plane is ground, Y is up.

        // Map Plan(x,y) -> 3D(x, -y) or (x, z)
        // Let's map Plan X -> 3D X, Plan Y -> 3D Z.

        mesh.position.set(cx, heightPx / 2, cy); // Centered vertically

        const angle = Math.atan2(dy, dx);
        mesh.rotation.y = -angle; // Negate for X/Z plane orientation if needed

        return mesh;
    }
};
