export function generateAutoSuggestions(findings, layout) {

    const suggestions = [];

    findings.forEach(f => {

        switch (f.rule) {

            case "MIN_ROOM_AREA":
                suggestions.push({
                    rule: f.rule,
                    riskLevel: f.riskLevel,
                    message: "Increase the room size slightly. Expanding by 1–2m² is usually sufficient for comfort and code alignment."
                });
                break;

            case "MIN_ROOM_WIDTH":
                suggestions.push({
                    rule: f.rule,
                    riskLevel: f.riskLevel,
                    message: "Increase minimum clear width. Consider adjusting furniture layout or wall alignment."
                });
                break;

            case "STAIR_WIDTH":
                suggestions.push({
                    rule: f.rule,
                    riskLevel: "HIGH",
                    message: "Increase stair width to at least 1.0m to support safe circulation."
                });
                break;

            default:
                suggestions.push({
                    rule: "GENERAL_IMPROVEMENT",
                    riskLevel: "LOW",
                    message: "Review room placement and circulation paths for comfort and accessibility."
                });
        }
    });

    return suggestions;
}
