/**
 * useWhatIf Protocol
 * React Hook to expose "What-If" simulation capabilities to the UI.
 * Wraps the deterministic SimulationEngine with React state management.
 */

import { useState, useCallback, useRef } from 'react';
import { SimulationEngine } from './simulationEngine';
import { useUIState } from '../../hooks/useUIState'; // To inform risk/confidence overrides

export function useWhatIf(twinState) {
    const [prediction, setPrediction] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const debounceRef = useRef(null);

    // Run a simulation for a proposed change (e.g., sliding a slicer)
    // Debounced to prevent CPU spam on rapid UI movement
    const simulateChange = useCallback((proposal) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        setIsSimulating(true);

        debounceRef.current = setTimeout(() => {
            try {
                // Run Deterministic Prediction
                const result = SimulationEngine.predictOutcome(twinState, proposal);
                setPrediction(result);
            } catch (err) {
                console.error('[useWhatIf] Simulation Failed:', err);
                setPrediction(null);
            } finally {
                setIsSimulating(false);
            }
        }, 50); // 50ms debounce (approx 20fps update limit)
    }, [twinState]);

    // Clear prediction when interaction ends
    const clearPrediction = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setPrediction(null);
        setIsSimulating(false);
    }, []);

    return {
        prediction,
        isSimulating,
        simulateChange,
        clearPrediction
    };
}
