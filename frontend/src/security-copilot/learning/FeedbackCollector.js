/**
 * Feedback Collector
 * Captures user signals (ratings, overrides) to improve AI models.
 */
class FeedbackCollector {
    constructor() {
        this.sessionLog = [];
    }

    /**
     * Record a user feedback event.
     * @param {string} actionId - unique ID of the action (repair rule)
     * @param {string} feedbackType - 'THUMBS_UP', 'THUMBS_DOWN', 'OVERRIDE'
     * @param {object} context - additional metadata (rule, confidence)
     */
    recordFeedback(actionId, feedbackType, context = {}) {
        const event = {
            timestamp: Date.now(),
            actionId,
            feedbackType,
            context,
            sessionId: window.sessionStorage.getItem('session_id') || 'unknown'
        };

        this.sessionLog.push(event);
        console.log('[FeedbackCollector] Recorded:', event);

        // In production, dispatch to backend or telemetry service
        // this.syncToCloud(event);
    }

    getFeedbackStats() {
        const positive = this.sessionLog.filter(e => e.feedbackType === 'THUMBS_UP').length;
        const negative = this.sessionLog.filter(e => e.feedbackType === 'THUMBS_DOWN').length;
        return { positive, negative, total: this.sessionLog.length };
    }
}

export const feedbackCollector = new FeedbackCollector();
