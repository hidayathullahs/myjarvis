import { ROOM_POLICY } from "./policy/roomPolicy.js";
import { BLUEPRINT_POLICY } from "./policy/blueprintPolicy.js";
import { SAFETY_POLICY } from "./policy/safetyPolicy.js";
import { CIRCULATION_POLICY } from "./policy/circulationPolicy.js";
import { COST_POLICY } from "./policy/costPolicy.js";

import { validateLayout } from "./validation/layoutSchema.js";
import { validateRiskScore } from "./validation/riskSchema.js";
import { validateSuggestion } from "./validation/suggestionSchema.js";
import { generateAutoSuggestions } from "./autoSuggest.js";
import { calculateConfidence } from "./confidence/confidenceEngine.js";
import { runSecondPass } from "./resolution/secondPassValidator.js"; // Phase 12-I
import { determineRepairs } from "./resolution/autoRepairAgent.js"; // Sprint 12-I2

function baseEvaluate(layout) {
    const findings = [];
    let riskScore = 0;

    if (!validateLayout(layout)) {
        return {
            allowed: false,
            riskScore: 100,
            findings: [{
                rule: "STRUCTURE_INVALID",
                message: "Layout schema failed validation",
                riskLevel: "HIGH",
                confidence: { score: 1.0, level: 'HIGH', explanation: "Schema validation is absolute." }
            }],
            summary: "Layout rejected because the underlying structure is invalid."
        };
    }

    layout.rooms.forEach(room => {
        const policy = ROOM_POLICY[room.type];

        if (!policy) return;

        if (room.area < policy.minArea) {
            const finding = {
                rule: "MIN_ROOM_AREA",
                message: `${room.type} area ${room.area}m² is below minimum ${policy.minArea}m²`,
                riskLevel: "MEDIUM",
                data: { actual: room.area, required: policy.minArea }
            };
            finding.confidence = calculateConfidence(finding, layout);
            findings.push(finding);
            riskScore += (8 * (finding.confidence.score || 1));
        }

        if (policy.minWidth && room.width < policy.minWidth) {
            const finding = {
                rule: "MIN_ROOM_WIDTH",
                message: `${room.type} width ${room.width}m is below minimum ${policy.minWidth}m`,
                riskLevel: "MEDIUM",
                data: { actual: room.width, required: policy.minWidth }
            };
            finding.confidence = calculateConfidence(finding, layout);
            findings.push(finding);
            riskScore += (6 * (finding.confidence.score || 1));
        }
    });

    if (layout.stairs?.width < BLUEPRINT_POLICY.minStairWidth) {
        const finding = {
            rule: "STAIR_WIDTH",
            message: `Stair width ${layout.stairs.width}m is below minimum ${BLUEPRINT_POLICY.minStairWidth}m`,
            riskLevel: "HIGH",
            data: { actual: layout.stairs.width, required: BLUEPRINT_POLICY.minStairWidth }
        };
        finding.confidence = calculateConfidence(finding, layout);
        findings.push(finding);
        riskScore += (12 * (finding.confidence.score || 1));
    }

    const allowed = riskScore < 60;
    riskScore = Math.round(riskScore);

    if (!validateRiskScore(riskScore)) {
        riskScore = 50;
    }

    return {
        allowed,
        riskScore,
        findings: findings.map(f => f),
        summary: generateSummary(findings, riskScore)
    };
}

function generateSummary(findings, riskScore) {
    if (!findings.length)
        return "No compliance issues detected. Layout complies with policy rules.";

    const lowConf = findings.filter(f => f.confidence && f.confidence.level === 'LOW').length;
    let suffix = "";
    if (lowConf > 0) suffix = ` ${lowConf} findings marked as Low Confidence (possible false positives).`;

    return `Detected ${findings.length} policy observations. Risk score = ${riskScore}.${suffix} These are recommendations intended to support safe, functional architectural design.`;
}

export function evaluateLayout(layout) {
    const result = baseEvaluate(layout);

    // Phase 12-I: Second Pass Resolution
    const activeFindings = [];
    const resolvedLog = [];

    result.findings.forEach(f => {
        const resolution = runSecondPass(f, layout);
        if (resolution.resolved) {
            resolvedLog.push({ original: f, resolution });
        } else {
            activeFindings.push(f);
        }
    });

    const suggestions = generateAutoSuggestions(activeFindings, layout);

    // Sprint 12-I2: Generate Auto-Repairs
    const repairs = [];
    activeFindings.forEach(f => {
        const fixes = determineRepairs(f, layout);
        if (fixes && fixes.length > 0) {
            repairs.push({
                findingId: f.rule + "_" + (f.data ? f.data.actual : Math.random()), // unique key fallback
                finding: f,
                actions: fixes
            });
        }
    });

    let enforcement = "ALLOW";
    if (result.riskScore >= 60) enforcement = "STRONGLY_REVIEW";
    else if (result.riskScore >= 40) enforcement = "REVIEW";
    else enforcement = "ALLOW";

    return {
        ...result,
        findings: activeFindings,
        resolvedFindings: resolvedLog,
        repairs, // Exposed for UI
        enforcement,
        suggestions
    };
}
