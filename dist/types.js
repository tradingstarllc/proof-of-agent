"use strict";
/**
 * Core types for Proof-of-Agent SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCORE_WEIGHTS = void 0;
exports.calculateTier = calculateTier;
// Score Calculation
function calculateTier(score) {
    if (score >= 80)
        return 'excellent';
    if (score >= 60)
        return 'good';
    if (score >= 40)
        return 'fair';
    return 'needs-work';
}
// Score Weights
exports.SCORE_WEIGHTS = {
    hasGithub: 15,
    hasApiEndpoint: 20,
    capabilityCount: 5, // per capability
    codeLines: 0.3, // per 100 lines
    hasDocumentation: 10,
    testCoverage: 0.2, // per %
    // Ecosystem bonuses
    usesPyth: 10,
    usesJito: 15,
    usesAgentKit: 5,
    agentKitPlugin: 3, // per plugin
    // Behavioral (max 25)
    behavioralMax: 25
};
//# sourceMappingURL=types.js.map