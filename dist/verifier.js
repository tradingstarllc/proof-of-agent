"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAgent = verifyAgent;
const axios_1 = __importDefault(require("axios"));
// Main verification function
async function verifyAgent(endpoint, capabilities, level) {
    const checks = {};
    const details = {};
    // 1. Liveness check - does endpoint respond?
    const liveness = await checkLiveness(endpoint);
    checks.liveness = liveness.success;
    details.liveness = liveness.success
        ? `Responded in ${liveness.responseTime}ms`
        : liveness.error || 'Failed to connect';
    if (!liveness.success) {
        return { score: 0, checks, details };
    }
    // 2. Health endpoint check
    const health = await checkHealth(endpoint);
    checks.healthEndpoint = health.success;
    details.healthEndpoint = health.success
        ? 'Health endpoint available'
        : 'No health endpoint';
    // 3. Response format check - returns valid JSON
    const format = await checkResponseFormat(endpoint);
    checks.validJson = format.success;
    details.validJson = format.success
        ? 'Returns valid JSON'
        : 'Invalid response format';
    // Basic level stops here
    if (level === 'basic') {
        return calculateScore(checks, details);
    }
    // 4. Capability tests (standard+)
    for (const cap of capabilities) {
        const capResult = await testCapability(endpoint, cap);
        checks[`capability_${cap}`] = capResult.success;
        details[`capability_${cap}`] = capResult.success
            ? `${cap} capability verified`
            : `${cap} capability failed`;
    }
    // Standard level stops here
    if (level === 'standard') {
        return calculateScore(checks, details);
    }
    // 5. Comprehensive tests
    // Consistency - same input = consistent output structure
    const consistency = await checkConsistency(endpoint);
    checks.consistency = consistency.success;
    details.consistency = consistency.success
        ? 'Responses are consistent'
        : 'Inconsistent responses';
    // Error handling - graceful failure
    const errorHandling = await checkErrorHandling(endpoint);
    checks.errorHandling = errorHandling.success;
    details.errorHandling = errorHandling.success
        ? 'Handles errors gracefully'
        : 'Poor error handling';
    // Rate limiting - respects reasonable limits
    const rateLimit = await checkRateLimiting(endpoint);
    checks.rateLimiting = rateLimit.success;
    details.rateLimiting = rateLimit.success
        ? 'Has rate limiting'
        : 'No rate limiting detected';
    return calculateScore(checks, details);
}
// Individual test functions
async function checkLiveness(endpoint) {
    const start = Date.now();
    try {
        const response = await axios_1.default.get(endpoint, { timeout: 10000 });
        return {
            success: response.status >= 200 && response.status < 400,
            responseTime: Date.now() - start
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
            responseTime: Date.now() - start
        };
    }
}
async function checkHealth(endpoint) {
    const healthPaths = ['/health', '/api/health', '/_health', '/status'];
    const baseUrl = endpoint.replace(/\/+$/, '');
    for (const path of healthPaths) {
        try {
            const response = await axios_1.default.get(`${baseUrl}${path}`, { timeout: 5000 });
            if (response.status === 200) {
                return { success: true, data: response.data, responseTime: 0 };
            }
        }
        catch {
            // Try next path
        }
    }
    return { success: false, responseTime: 0 };
}
async function checkResponseFormat(endpoint) {
    try {
        const response = await axios_1.default.get(endpoint, { timeout: 5000 });
        if (typeof response.data === 'object') {
            return { success: true, data: response.data, responseTime: 0 };
        }
        // Try parsing if string
        if (typeof response.data === 'string') {
            JSON.parse(response.data);
            return { success: true, responseTime: 0 };
        }
        return { success: false, responseTime: 0 };
    }
    catch {
        return { success: false, responseTime: 0 };
    }
}
async function testCapability(endpoint, capability) {
    const baseUrl = endpoint.replace(/\/+$/, '');
    const testPrompts = {
        trading: {
            path: '/analyze',
            body: { symbol: 'SOL', action: 'analyze' },
            expectedFields: ['recommendation', 'signal', 'action']
        },
        analysis: {
            path: '/analyze',
            body: { query: 'What is the current market sentiment?' },
            expectedFields: ['analysis', 'summary', 'result']
        },
        social: {
            path: '/generate',
            body: { prompt: 'Generate a tweet about Solana' },
            expectedFields: ['content', 'text', 'response']
        },
        defi: {
            path: '/quote',
            body: { fromToken: 'SOL', toToken: 'USDC', amount: 1 },
            expectedFields: ['quote', 'price', 'route']
        }
    };
    const test = testPrompts[capability] || {
        path: '/test',
        body: { capability },
        expectedFields: ['success', 'result']
    };
    try {
        const response = await axios_1.default.post(`${baseUrl}${test.path}`, test.body, {
            timeout: 15000,
            validateStatus: () => true // Accept any status
        });
        // Check if response has any expected fields
        if (typeof response.data === 'object') {
            const hasExpectedField = test.expectedFields.some((field) => field in response.data);
            if (hasExpectedField || response.status === 200) {
                return { success: true, data: response.data, responseTime: 0 };
            }
        }
        return { success: false, responseTime: 0 };
    }
    catch {
        return { success: false, responseTime: 0 };
    }
}
async function checkConsistency(endpoint) {
    try {
        const responses = await Promise.all([
            axios_1.default.get(endpoint, { timeout: 5000 }),
            axios_1.default.get(endpoint, { timeout: 5000 })
        ]);
        // Check if response structure is consistent
        const keys1 = Object.keys(responses[0].data || {}).sort();
        const keys2 = Object.keys(responses[1].data || {}).sort();
        const consistent = JSON.stringify(keys1) === JSON.stringify(keys2);
        return { success: consistent, responseTime: 0 };
    }
    catch {
        return { success: false, responseTime: 0 };
    }
}
async function checkErrorHandling(endpoint) {
    const baseUrl = endpoint.replace(/\/+$/, '');
    try {
        const response = await axios_1.default.post(`${baseUrl}/invalid-endpoint-test`, { invalid: 'data' }, { timeout: 5000, validateStatus: () => true });
        // Good error handling = returns structured error, not crash
        if (response.status >= 400 && response.status < 600) {
            if (typeof response.data === 'object' && 'error' in response.data) {
                return { success: true, responseTime: 0 };
            }
        }
        return { success: false, responseTime: 0 };
    }
    catch {
        return { success: false, responseTime: 0 };
    }
}
async function checkRateLimiting(endpoint) {
    try {
        // Send 5 rapid requests
        const responses = await Promise.all(Array(5).fill(null).map(() => axios_1.default.get(endpoint, { timeout: 5000, validateStatus: () => true })));
        // Check if any returned 429 (rate limited)
        const hasRateLimit = responses.some(r => r.status === 429);
        // Or has rate limit headers
        const hasHeaders = responses.some(r => r.headers['x-ratelimit-limit'] ||
            r.headers['ratelimit-limit'] ||
            r.headers['retry-after']);
        return { success: hasRateLimit || hasHeaders, responseTime: 0 };
    }
    catch {
        return { success: false, responseTime: 0 };
    }
}
function calculateScore(checks, details) {
    const total = Object.keys(checks).length;
    const passed = Object.values(checks).filter(Boolean).length;
    // Weight certain checks higher
    let score = 0;
    const weights = {
        liveness: 30,
        healthEndpoint: 10,
        validJson: 15,
        consistency: 10,
        errorHandling: 10,
        rateLimiting: 5
    };
    for (const [check, passed] of Object.entries(checks)) {
        if (passed) {
            score += weights[check] || 10; // Default 10 for capabilities
        }
    }
    // Normalize to 100
    const maxScore = Object.keys(checks).reduce((sum, key) => sum + (weights[key] || 10), 0);
    const normalizedScore = Math.round((score / maxScore) * 100);
    return {
        score: normalizedScore,
        checks,
        details
    };
}
//# sourceMappingURL=verifier.js.map