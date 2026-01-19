/**
 * Simulation Validators
 * Guards against hallucination or unsafe simulation requests.
 */

export const SimulationValidators = {
    validateRequest: (state, proposal) => {
        if (!state.model.loaded) {
            return { valid: false, error: 'Cannot simulate: No model loaded.' };
        }

        // Check for infinite values in proposal
        if (proposal.offset && !Number.isFinite(proposal.offset)) {
            return { valid: false, error: 'Simulation rejected: Infinite/NaN offset.' };
        }

        return { valid: true };
    }
};
