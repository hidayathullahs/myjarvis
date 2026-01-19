/**
 * Extraction Pipeline
 * Orchestrates the full image-to-geometry process.
 * Input: Image Blob -> Output: Semantic Geometry JSON
 */

import { WallAssembler } from './wallAssembler';

import { CVPipeline } from './cv/cvPipeline';
import { CVUtils } from './cv/cvUtils';

export const ExtractionPipeline = {
    /**
     * Run the full extraction suite.
     * @param {string} imageUrl - Blob URL of the preprocessed plan
     * @returns {Promise<Object>} ExtractionResult
     */
    /**
     * Run the full extraction suite.
     * @param {string} imageUrl - Blob URL of the preprocessed plan
     * @returns {Promise<Object>} ExtractionResult
     */
    run: async (imageUrl) => {
        const startTime = Date.now();
        let rawSegments = [];
        let method = 'MOCK';

        try {
            // 1. Try Real CV Engine
            await CVPipeline.init('/opencv.js'); // Assuming public path

            // Helper to get ImageData
            const imageData = await getImageDataFromUrl(imageUrl);

            const cvResult = await CVPipeline.process(imageData, {
                houghThreshold: 40,
                minLineLength: 30,
                maxLineGap: 10
            });

            // Post-Process
            rawSegments = CVUtils.filterNoise(cvResult.lines, 15);

            // Add confidence if missing (Worker might return raw coords)
            rawSegments = rawSegments.map(s => ({ ...s, confidence: 0.8 }));

            method = 'OPENCV';

        } catch (err) {
            console.warn("[ExtractionPipeline] CV Failed, using Mock fallback:", err);
            // Fallback to Mock
            rawSegments = await MockLineDetector(imageUrl);
        }

        console.log(`[ExtractionPipeline] Extracted ${rawSegments.length} lines via ${method}`);

        // 2. Geometry Assembly (Logic Step)
        const assembly = WallAssembler.assembleWalls(rawSegments);

        // 3. Opening Detection (Logic Step)
        // const openings = OpeningDetector.detect(assembly.walls); // TODO

        return {
            timestamp: Date.now(),
            predictionId: `extr_${Date.now().toString(36)}`,
            walls: assembly.walls,
            openings: [], // assembly.openings
            meta: {
                scale: 1.0,
                uncertainty: method === 'MOCK' ? 0.3 : 0.8,
                sourceLatency: Date.now() - startTime,
                method
            }
        };
    }
};

// Helper
async function getImageDataFromUrl(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
        };
        img.onerror = reject;
        img.src = url;
    });
}

// Temporary Mock to validate Pipeline Flow
const MockLineDetector = async (url) => {
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 500));

    // Return dummy simple room box
    return [
        { x1: 50, y1: 50, x2: 450, y2: 50, confidence: 0.95 },   // Top
        { x1: 450, y1: 50, x2: 450, y2: 350, confidence: 0.92 }, // Right
        { x1: 450, y1: 350, x2: 50, y2: 350, confidence: 0.94 }, // Bottom
        { x1: 50, y1: 350, x2: 50, y2: 50, confidence: 0.91 }    // Left
    ];
};
