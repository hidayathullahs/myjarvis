# False Positive Intelligence & Confidence Strategy (Phase 12-H)

## Overview
The Security Copilot now includes a **Confidence Scoring Engine** to distinguish between high-certainty violations and likely false positives. This ensures safety without blocking valid architectural creativity.

## 1. Confidence Architecture

Every policy finding now includes a `confidence` object:

```json
{
  "confidence": {
    "score": 0.85,          // 0.0 - 1.0
    "level": "HIGH",        // HIGH, MEDIUM, LOW
    "explanation": "..."    // Human-readable reason
  }
}
```

## 2. Intelligence Layers

### A. Slack Margin Detection
- **Logic**: If a value is within 5% of the threshold, confidence is lowered.
- **Goal**: Prevent "pixel-perfect" enforcement issues.

### B. Stability Index
- **Logic**: Layouts with jagged walls, weird aspect ratios, or non-orthogonal geometry receive a lower stability score.
- **Effect**: Lower stability = Lower confidence in strict rule enforcement.

### C. Override Tracker (Mock)
- **Logic**: Rules that are frequently overridden by humans in the past are marked as "Soft Constraints".
- **Effect**: Reduces confidence automatically for controversial rules.

## 3. Decision Matrix

| Confidence | Severity | System Action |
| :--- | :--- | :--- |
| **HIGH** (>0.8) | HIGH | **BLOCK** |
| **HIGH** (>0.8) | LOW | **WARN** |
| **MEDIUM** (>0.5) | ANY | **WARN** (with Check Request) |
| **LOW** (<0.5) | ANY | **LOG ONLY** (Info) |

## 4. Next Steps (Phase 12-I)
- **Second-Pass Validator**: Re-simulate "Low Confidence" items with smoothing.
- **Auto-Repair**: Suggest one-click fixes for borderline violations.
- **Feedback Loop**: Capture user "Ignore" actions to train the Override Tracker.
