/**
 * CV Pipeline
 * Manages the interaction with the CV WebWorker.
 */

import { PerformanceMetrics } from '../../debug/PerformanceMonitor';

export const CVPipeline = {
    worker: null,

    init: (scriptUrl = '/opencv.js') => {
        return new Promise((resolve, reject) => {
            if (CVPipeline.worker) return resolve();

            // Vite/Webpack worker syntax might vary.
            // Using generic Worker constructor assuming file is served or bundled.
            // For Vite: new Worker(new URL('./cvWorker.js', import.meta.url), { type: 'module' })

            try {
                CVPipeline.worker = new Worker(new URL('./cvWorker.js', import.meta.url), { type: 'module' });

                const handler = (e) => {
                    if (e.data.type === 'READY') {
                        CVPipeline.worker.removeEventListener('message', handler);
                        resolve();
                    } else if (e.data.type === 'ERROR') {
                        CVPipeline.worker.removeEventListener('message', handler);
                        reject(e.data.payload);
                    }
                };

                CVPipeline.worker.addEventListener('message', handler);
                CVPipeline.worker.postMessage({ type: 'INIT', payload: { scriptUrl } });

            } catch (err) {
                reject(err);
            }
        });
    },

    process: (imageData, config = {}) => {
        return new Promise((resolve, reject) => {
            const start = performance.now();
            if (!CVPipeline.worker) return reject(new Error("Worker not initialized"));

            const handler = (e) => {
                if (e.data.type === 'RESULT') {
                    CVPipeline.worker.removeEventListener('message', handler);
                    PerformanceMetrics.report('cv', performance.now() - start);
                    resolve(e.data.payload);
                } else if (e.data.type === 'ERROR') {
                    CVPipeline.worker.removeEventListener('message', handler);
                    reject(new Error(e.data.payload));
                }
            };

            CVPipeline.worker.addEventListener('message', handler);
            CVPipeline.worker.postMessage({ type: 'PROCESS_IMAGE', payload: imageData, config });
        });
    },

    terminate: () => {
        if (CVPipeline.worker) {
            CVPipeline.worker.terminate();
            CVPipeline.worker = null;
        }
    }
};
