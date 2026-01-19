/**
 * Plan Preprocessor
 * Normalizes raw image data for CV consumption.
 * - Converts to Grayscale
 * - Normalizes Size/DPI (basic)
 * - Outputs Blob URLs
 */

export const PlanPreprocessor = {
    /**
     * Process an image file into standardized assets.
     * @param {File} file 
     * @returns {Promise<{ original: string, grayscale: string, dimensions: {w, h} }>}
     */
    processImage: (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);

            img.onload = () => {
                try {
                    // 1. Create Canvas
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // 2. Set Dimensions (Max limit for performance?)
                    // For now, keep original unless huge.
                    canvas.width = img.width;
                    canvas.height = img.height;

                    // 3. Draw Original
                    ctx.drawImage(img, 0, 0);

                    // 4. Convert to Grayscale
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    for (let i = 0; i < data.length; i += 4) {
                        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                        data[i] = avg;     // R
                        data[i + 1] = avg; // G
                        data[i + 2] = avg; // B
                    }

                    ctx.putImageData(imageData, 0, 0);

                    // 5. Export
                    const grayscaleUrl = canvas.toDataURL('image/png');

                    resolve({
                        original: objectUrl,
                        grayscale: grayscaleUrl,
                        dimensions: { w: img.width, h: img.height }
                    });

                } catch (e) {
                    reject(e);
                }
            };

            img.onerror = (err) => reject(new Error('Failed to load image for processing'));
            img.src = objectUrl;
        });
    }

    // Future: PDF processing using PDF.js
};
