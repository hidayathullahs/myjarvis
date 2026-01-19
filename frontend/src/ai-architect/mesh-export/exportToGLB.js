/**
 * @fileoverview GLB Exporter Wrapper
 * Exports generated 3D scenes to standard .glb binary format.
 */

import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';

export class SceneExporter {

    /**
     * Exports a Three.js scene/object to GLB Blob
     * @param {THREE.Object3D} input 
     * @returns {Promise<Blob>}
     */
    static exportToGLB(input) {
        const exporter = new GLTFExporter();

        return new Promise((resolve, reject) => {
            exporter.parse(
                input,
                (gltf) => {
                    const blob = new Blob([gltf], { type: 'model/gltf-binary' });
                    resolve(blob);
                },
                (error) => {
                    console.error('An error happened during GLB export:', error);
                    reject(error);
                },
                { binary: true } // Options
            );
        });
    }
}
