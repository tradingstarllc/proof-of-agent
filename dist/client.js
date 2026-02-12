"use strict";
/**
 * PoA Client - SDK for Proof-of-Agent verification
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoAClient = void 0;
const axios_1 = __importDefault(require("axios"));
class PoAClient {
    constructor(options = {}) {
        this.options = {
            network: options.network || 'devnet',
            ...options
        };
        const baseUrl = options.baseUrl ||
            (options.network === 'mainnet'
                ? 'https://api.moltlaunch.com' // Future mainnet
                : 'https://youragent.id');
        this.http = axios_1.default.create({
            baseURL: baseUrl,
            timeout: 120000, // 2 min for deep verification
            headers: {
                'Content-Type': 'application/json',
                ...(options.apiKey && { 'X-API-Key': options.apiKey })
            }
        });
    }
    /**
     * Quick verification - basic checks, ~10 seconds
     */
    async verifyQuick(request) {
        const response = await this.http.post('/api/verify/quick', request);
        return response.data;
    }
    /**
     * Deep verification - comprehensive analysis, ~60 seconds
     */
    async verifyDeep(request) {
        const response = await this.http.post('/api/verify/deep', request);
        return response.data;
    }
    /**
     * Get verification status for an agent
     */
    async getStatus(agentId) {
        const response = await this.http.get(`/api/verify/status/${encodeURIComponent(agentId)}`);
        return response.data;
    }
    /**
     * List all verified agents (score >= 60)
     */
    async listVerified() {
        const response = await this.http.get('/api/verify/list');
        return response.data;
    }
    /**
     * Generate STARK proof for threshold verification
     */
    async generateProof(agentId, options = {}) {
        const response = await this.http.post(`/api/stark/generate/${encodeURIComponent(agentId)}`, {
            threshold: options.threshold || 60,
            validityDays: options.validityDays || 30
        });
        return response.data;
    }
    /**
     * Verify a STARK proof
     */
    async verifyProof(proofHash) {
        const response = await this.http.post('/api/stark/verify', { proofHash });
        return response.data;
    }
    /**
     * Submit execution trace for behavioral scoring
     */
    async submitTrace(agentId, trace) {
        const response = await this.http.post('/api/traces', { agentId, trace });
        return response.data;
    }
    /**
     * Get traces for an agent
     */
    async getTraces(agentId) {
        const response = await this.http.get(`/api/traces/${encodeURIComponent(agentId)}`);
        return response.data;
    }
    /**
     * Get NFT badge metadata
     */
    async getBadge(agentId) {
        const response = await this.http.get(`/api/badge/${encodeURIComponent(agentId)}`);
        return response.data;
    }
    /**
     * Get Pyth price feed
     */
    async getPythPrice(symbol) {
        const response = await this.http.get(`/api/oracles/pyth/price/${encodeURIComponent(symbol)}`);
        return response.data;
    }
    /**
     * Get Jito tip estimate
     */
    async getJitoTip(urgency = 'medium') {
        const response = await this.http.get(`/api/mev/jito/tip-estimate?urgency=${urgency}`);
        return {
            estimatedTip: response.data.estimatedTip,
            tipAccounts: response.data.tipAccountsSample
        };
    }
    /**
     * Check if agent uses Solana Agent Kit
     */
    async detectAgentKit(agentId, packageJson) {
        const response = await this.http.post('/api/verify/agent-kit', {
            agentId,
            packageJson
        });
        return response.data;
    }
}
exports.PoAClient = PoAClient;
// Default export
exports.default = PoAClient;
//# sourceMappingURL=client.js.map