/**
 * Explanation Builders
 * Template library for safe, deterministic narrative generation.
 * ENSURES: No hallucinations, consistent tone, operator-friendly clarity.
 */

export const ExplanationTemplates = {
    // RISK FACTORS
    riskRising: (room, reason) => `Risk rising due to ${room} ${reason}.`,
    riskCritical: (count) => `CRITICAL: ${count} zones are currently unsafe.`,

    // VISIBILITY
    visibilityDrop: (val) => `visibility reduced to ${(val * 100).toFixed(0)}%`,
    visibilityZero: () => `complete occlusion detected`,

    // TRENDS
    trendRising: (sec) => `Risk trending UP for ${sec.toFixed(1)}s`,
    trendFalling: () => `System stabilizing`,
    volatilityWarning: (dur) => `Volatility HIGH for ${dur.toFixed(1)}s`,

    // FORECAST
    forecastWarning: (sec) => `Forecast: WARNING likely in ~${sec}s`,
    forecastCritical: (sec) => `Forecast: CRITICAL likely in ~${sec}s`,
    forecastStable: () => `Forecast: Nominal`,

    // CONFIDENCE
    confidenceLow: (factor) => `Confidence LOW due to ${factor}`,
    confidenceMedium: () => `Confidence MEDIUM`,
};
