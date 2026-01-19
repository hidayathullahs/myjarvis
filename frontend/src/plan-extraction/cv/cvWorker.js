/**
 * CV Worker
 * Runs heavy Computer Vision tasks off the main thread.
 * 
 * Responsibilities:
 * 1. Load OpenCV.js (async)
 * 2. Receive Image Data (ImageData/ArrayBuffer)
 * 3. Process: Grayscale -> Canny -> HoughLinesP
 * 4. Return Raw Line Segments
 */

// Placeholder for OpenCV lazy loading
let cvLoaded = false;

self.onmessage = function (e) {
    const { type, payload, config } = e.data;

    switch (type) {
        case 'INIT':
            initOpenCV(payload.scriptUrl);
            break;
        case 'PROCESS_IMAGE':
            if (!cvLoaded) {
                self.postMessage({ type: 'ERROR', payload: 'OpenCV not loaded' });
                return;
            }
            try {
                const result = processImage(payload, config);
                self.postMessage({ type: 'RESULT', payload: result });
            } catch (err) {
                self.postMessage({ type: 'ERROR', payload: err.message });
            }
            break;
        default:
            console.warn('Unknown message type:', type);
    }
};

function initOpenCV(url) {
    if (cvLoaded) {
        self.postMessage({ type: 'READY' });
        return;
    }

    // Attempt to load OpenCV.js
    // Note: The user must ensure opencv.js is available at the provided URL.
    try {
        self.importScripts(url || '/opencv.js');

        // Wait for runtime initialization if needed
        if (self.cv) {
            // Some versions of OpenCV.js use a Promise or callback
            if (self.cv.onRuntimeInitialized) {
                self.cv.onRuntimeInitialized = () => {
                    cvLoaded = true;
                    self.postMessage({ type: 'READY' });
                };
            } else {
                // Assume ready
                cvLoaded = true;
                self.postMessage({ type: 'READY' });
            }
        } else {
            throw new Error("Failed to load cv object");
        }
    } catch (e) {
        self.postMessage({ type: 'ERROR', payload: `Failed to load OpenCV: ${e.message}` });
    }
}

function processImage(imageData, config = {}) {
    const cv = self.cv;
    const results = {
        lines: [],
        meta: { processingTime: 0 }
    };

    const startTime = performance.now();

    // 1. Create Mat from ImageData
    let src = cv.matFromImageData(imageData);
    let dst = new cv.Mat();
    let lines = new cv.Mat();

    try {
        // 2. Grayscale
        cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);

        // 3. Threshold / Canny
        // Using Canny for edge detection
        // Config defaults
        const t1 = config.threshold1 || 50;
        const t2 = config.threshold2 || 150;
        const aperture = 3;
        cv.Canny(src, dst, t1, t2, aperture, false);

        // 4. HoughLinesP
        const rho = 1;
        const theta = Math.PI / 180;
        const threshold = config.houghThreshold || 50;
        const minLineLength = config.minLineLength || 50;
        const maxLineGap = config.maxLineGap || 10;

        cv.HoughLinesP(dst, lines, rho, theta, threshold, minLineLength, maxLineGap);

        // 5. Extract Lines
        for (let i = 0; i < lines.rows; ++i) {
            results.lines.push({
                x1: lines.data32S[i * 4],
                y1: lines.data32S[i * 4 + 1],
                x2: lines.data32S[i * 4 + 2],
                y2: lines.data32S[i * 4 + 3]
            });
        }

    } finally {
        // Clean up to prevent leaks!
        src.delete();
        dst.delete();
        lines.delete();
    }

    results.meta.processingTime = performance.now() - startTime;
    return results;
}
