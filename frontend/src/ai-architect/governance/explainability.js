/**
 * @fileoverview Design Explainability Engine
 * Converts solver decisions into human-readable rationale.
 */

import { CostEstimator } from '../financial/costEstimator';
import { SunPathEngine } from '../environmental/sunPathEngine';
import { evaluateLayout } from '../../security-copilot/securityCopilot.js'; // Phase 12 Integrated Governance

export class ExplainabilityEngine {

    static generateReport(layout, reqs = {}) {
        const insights = [];
        const limitations = [];

        // 0. Base Data extraction
        const floors = reqs.floors || 1;
        const orientation = reqs.orientation || 'NORTH';

        // 1. Plot & Efficiency
        const areaSqM = layout.width * layout.length;
        const builtUpArea = layout.rooms.reduce((acc, r) => acc + (r.width * r.length), 0);
        insights.push(`Plot Area: ${areaSqM} m². Built-Up: ${builtUpArea.toFixed(1)} m². Efficiency: ${(layout.efficiency * 100).toFixed(0)}%.`);

        // 2. Room Placement Rationale
        layout.rooms.forEach(room => {
            if (room.type === 'LIVING') {
                insights.push(`Living Room placed centrally for accessibility.`);
            } else if (room.type === 'PARKING') {
                insights.push(`Parking allocated near road frontage.`);
            } else if (room.type.includes('BEDROOM')) {
                const zone = room.y > layout.length * 0.6 ? "Rear (Quiet)" : "Side";
                insights.push(`${room.type} in ${zone} Zone.`);
            }
        });

        // 3. Environmental Analysis (Feature #9)
        const sunAnalysis = SunPathEngine.analyze(layout, orientation);
        insights.push(`Solar Score: ${sunAnalysis.score}/100 (${sunAnalysis.rating}).`);
        sunAnalysis.insights.forEach(txt => insights.push("☀ " + txt));

        // 4. Financial Analysis (Feature #7)
        // Heuristic: Multi-floor built-up area
        const totalBuiltUp = builtUpArea * floors;
        const costEst = CostEstimator.calculate(totalBuiltUp, floors, 'STANDARD');
        insights.push(`Est. Cost: ${CostEstimator.formatCurrency(costEst.total)} (${costEst.areaSqFt} sft).`);

        // 5. Failures / Unplaced
        if (layout.unplaced && layout.unplaced.length > 0) {
            layout.unplaced.forEach(fail => {
                limitations.push(`Could not place ${fail.type}: ${fail.reason}. Try increasing plot size.`);
            });
        }

        // 6. Security & Governance (Phase 12)
        const security = evaluateLayout(layout);
        if (security.findings.length > 0) {
            security.findings.forEach(f => {
                // Push Low/Med risks to insights/limitations based on severity
                const icon = f.riskLevel === 'HIGH' ? '⛔' : '⚠';
                limitations.push(`${icon} ${f.message} (${f.confidence ? f.confidence.level : 'Check'} Conf.)`);
            });
        }
        if (security.repairs && security.repairs.length > 0) {
            insights.push(`💡 ${security.repairs.length} Auto-Fixes available for compliance.`);
        }

        // Return full structure for UI consumption
        return {
            title: "AI Analysis Report",
            summary: `Design achieves ${sunAnalysis.rating.toLowerCase()} solar efficiency with optimized zoning.`,
            insights,
            limitations,
            cost: costEst, // Return raw object for detailed UI chart if needed
            solar: sunAnalysis,
            security: security // Full object for UI actions
        };
    }
}
