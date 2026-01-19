/**
 * usePlanReconstruction Hook
 * Orchestrates the full 2D -> 3D Pipeline within the React lifecycle.
 * Manages async state and updates Digital Twin.
 */

import { useState, useCallback } from 'react';
import { PlanValidators } from '../plan-input/planValidators';
import { PlanPreprocessor } from '../plan-input/planPreprocessor';
import { ExtractionPipeline } from '../plan-extraction/extractionPipeline';
import { SemanticPipeline } from '../plan-semantic/semanticPipeline';
import { MeshBuilder } from '../plan-mesh/meshBuilder';

export const usePlanReconstruction = ({ onComplete }) => {
    const [status, setStatus] = useState('idle'); // idle, processing, complete, error
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const processPlan = useCallback(async (file) => {
        setStatus('processing');
        setProgress(0);
        setError(null);

        try {
            // 1. Validation
            const v = PlanValidators.validateFile(file);
            if (!v.valid) throw new Error(v.error);
            setProgress(10);

            // 2. Preprocessing (Norm)
            const assets = await PlanPreprocessor.processImage(file);
            setProgress(30);

            // 3. Extraction (CV)
            // Use the grayscale asset for CV
            const extraction = await ExtractionPipeline.run(assets.grayscale);
            setProgress(60);

            // 4. Semantics (Logic)
            const building = SemanticPipeline.run(extraction);
            setProgress(80);

            // 5. Mesh Generation (3D)
            const meshGroup = MeshBuilder.build(building);
            setProgress(100);

            const result = {
                buildingModel: building,
                mesh: meshGroup,
                assets
            };

            setStatus('complete');
            if (onComplete) onComplete(result);
            return result;

        } catch (err) {
            console.error('Reconstruction Failed:', err);
            setError(err.message);
            setStatus('error');
            return null;
        }
    }, [onComplete]);

    return {
        processPlan,
        status,
        progress,
        error
    };
};
