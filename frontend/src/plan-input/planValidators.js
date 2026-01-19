/**
 * Plan Validators
 * Security and Data Integrity checks for Blueprint Ingestion.
 */

const MAX_FILE_SIZE_MB = 20;
const ALLOWED_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/pdf'
];

export const PlanValidators = {
    validateFile: (file) => {
        // 1. Existence
        if (!file) return { valid: false, error: 'No file provided.' };

        // 2. Type Check
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return {
                valid: false,
                error: `Unsupported format: ${file.type}. Allowed: PNG, JPG, PDF.`
            };
        }

        // 3. Size Check
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > MAX_FILE_SIZE_MB) {
            return {
                valid: false,
                error: `File too large (${fileSizeMB.toFixed(1)}MB). Max: ${MAX_FILE_SIZE_MB}MB.`
            };
        }

        // 4. Basic Safety (Filename sanitization could go here)
        return { valid: true };
    },

    validateConsent: (consented) => {
        if (consented !== true) {
            return { valid: false, error: 'User consent required for blueprint ingest.' };
        }
        return { valid: true };
    }
};
