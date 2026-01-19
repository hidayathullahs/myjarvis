export const RISK_LEVELS = {
    STABLE: 'stable',     // Normal operation
    ADVISORY: 'advisory', // Low-level concern (e.g. slight sensor drift)
    WARNING: 'warning',   // Requires attention (e.g. clipping active, high latency)
    CRITICAL: 'critical'  // Immediate action required (e.g. system failure, security breach)
};
