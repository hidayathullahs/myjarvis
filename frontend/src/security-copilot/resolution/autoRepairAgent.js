// import { produce } from 'immer'; // Unused

/**
 * AutoRepair Agent
 * Analyzes findings and generates repair actions.
 */
export function determineRepairs(finding, /* layout */) {
    const repairs = [];

    // Strategy 1: Room Area Expansion (for MIN_ROOM_AREA)
    if (finding.rule === 'MIN_ROOM_AREA' && finding.data) {
        const { actual, required, id } = finding.data;
        if (id) {
            const diff = required - actual;
            // Suggest Small Expansion if deviation is small
            if (diff > 0 && diff < 5.0) {
                repairs.push({
                    label: `Expand to ${required}m²`,
                    actionType: 'RESIZE_ROOM',
                    params: { roomId: id, targetArea: required, method: 'EXPAND_EDGES' },
                    riskAnalysis: 'LOW_RISK: Minor boundary shift.'
                });
            }
        }
    }

    // Strategy 2: Corridor Width (MIN_WIDTH)
    if (finding.rule === 'MIN_ROOM_WIDTH' && finding.data) {
        const { required, id } = finding.data;
        if (id) {
            repairs.push({
                label: `Widen to ${required}m`,
                actionType: 'RESIZE_ROOM',
                params: { roomId: id, targetWidth: required, axis: 'X' }, // Simplistic assumption
                riskAnalysis: 'MED_RISK: May displace adjacent rooms.'
            });
        }
    }

    return repairs;
}
