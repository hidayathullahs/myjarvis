export function validateSuggestion(s) {
    return (
        typeof s?.rule === "string" &&
        typeof s?.message === "string" &&
        ["LOW", "MEDIUM", "HIGH"].includes(s?.riskLevel ?? "LOW")
    );
}
