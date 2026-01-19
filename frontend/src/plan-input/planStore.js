/**
 * Plan Store
 * State management for the 2D Blueprint Ingestion Pipeline.
 * Traceable, Serializable, Durable.
 */

export const INITIAL_PLAN_STATE = {
    id: null,
    name: null,
    sourceType: null, // 'image' | 'pdf'
    meta: {
        fileSize: 0,
        mimeType: null,
        importedAt: null,
        dimensions: { w: 0, h: 0 }
    },
    flags: {
        consent: false,
        processed: false
    },
    // URLs for the processed assets
    assets: {
        original: null,
        grayscale: null,
        binary: null
    },
    status: 'idle', // idle | uploading | processing | ready | error
    error: null
};

// Simple mutation helpers (Pure functions)
export const PlanMutations = {
    reset: () => ({ ...INITIAL_PLAN_STATE }),

    startUpload: (state, fileName) => ({
        ...state,
        name: fileName,
        status: 'uploading',
        error: null
    }),

    setFileMeta: (state, { size, type }) => ({
        ...state,
        meta: { ...state.meta, fileSize: size, mimeType: type, importedAt: Date.now() }
    }),

    setProcessing: (state) => ({ ...state, status: 'processing' }),

    setAssets: (state, assets, dimensions) => ({
        ...state,
        assets: { ...state.assets, ...assets },
        meta: { ...state.meta, dimensions: dimensions || state.meta.dimensions },
        flags: { ...state.flags, processed: true },
        status: 'ready'
    }),

    setError: (state, errorMsg) => ({
        ...state,
        status: 'error',
        error: errorMsg
    }),

    setConsent: (state, hasConsented) => ({
        ...state,
        flags: { ...state.flags, consent: hasConsented }
    })
};
