import { useState, useCallback, useMemo } from 'react';
import { INITIAL_TWIN_STATE } from '../digital-twin/twinState';
import { TelemetryAdapter } from '../digital-twin/telemetry/telemetryAdapter';
import { TwinSelectors } from '../digital-twin/twinSelectors';
import { SystemLog, LOG_TYPES } from '../runtime/systemLog';

export function useDigitalTwin() {
    const [state, setState] = useState(INITIAL_TWIN_STATE);

    // Main Entry Point for Reality -> Twin
    const sendTelemetry = useCallback((eventType, payload) => {
        setState(current => {
            const { nextState, success, error } = TelemetryAdapter.processEvent(current, eventType, payload);
            if (!success && error) {
                SystemLog.error(LOG_TYPES.SYSTEM, `Telemetry Fail: ${error}`);
            } else {
                // Log significant events
                if (eventType === 'RISK_UPDATE') {
                    SystemLog.info(LOG_TYPES.RISK_CHANGE, `Risk Level: ${nextState.risk.level}`);
                }
            }
            return nextState;
        });
    }, []);

    // Memoize Selectors to prevent unnecessary re-calcs
    const selectors = useMemo(() => ({
        modelName: TwinSelectors.getModelName(state),
        isLoaded: TwinSelectors.isModelLoaded(state),
        volume: TwinSelectors.getModelVolume(state),
        lastAction: TwinSelectors.getLastAction(state),
        riskDrivers: TwinSelectors.activeRiskDrivers(state),
        isSlicing: TwinSelectors.isSlicingActive(state),
        showWarning: TwinSelectors.shouldShowWarning(state)
    }), [state]);

    return {
        twinState: state,
        sendTelemetry,
        selectors
    };
}
