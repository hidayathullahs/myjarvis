export function validateRiskScore(score) {
    return typeof score === "number" && score >= 0 && score <= 100;
}
