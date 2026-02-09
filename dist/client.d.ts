/**
 * PoA Client - SDK for Proof-of-Agent verification
 */
export interface PoAClientOptions {
    network?: 'mainnet' | 'devnet';
    apiKey?: string;
    baseUrl?: string;
}
export interface QuickVerifyRequest {
    agentId: string;
    apiEndpoint: string;
}
export interface DeepVerifyRequest {
    agentId: string;
    apiEndpoint?: string;
    capabilities?: string[];
    codeUrl?: string;
    documentation?: boolean;
    testCoverage?: number;
    codeLines?: number;
}
export interface VerificationResult {
    success: boolean;
    agentId: string;
    score: number;
    tier: 'excellent' | 'good' | 'fair' | 'needs-work';
    checks: Record<string, boolean>;
    attestation?: {
        hash: string;
        validUntil: string;
        expiresAt: string;
    };
    behavioral?: {
        bonus: number;
        traceCount: number;
    };
}
export interface VerificationStatus {
    verified: boolean;
    score: number;
    tier: string;
    verifiedAt?: string;
    expiresAt?: string;
    attestation?: any;
}
export interface StarkProof {
    valid: boolean;
    meetsThreshold: boolean;
    proof: {
        commitment: string;
        trace: string;
        proofHash: string;
    };
    publicInputs: {
        threshold: number;
        timestampVerified: number;
    };
}
export interface ExecutionTrace {
    period: {
        start: string;
        end: string;
    };
    summary: {
        totalActions: number;
        successRate: number;
        errorRate: number;
    };
    actions?: Array<{
        type: string;
        timestamp: string;
        success: boolean;
        metadata?: any;
    }>;
}
export declare class PoAClient {
    private http;
    private options;
    constructor(options?: PoAClientOptions);
    /**
     * Quick verification - basic checks, ~10 seconds
     */
    verifyQuick(request: QuickVerifyRequest): Promise<VerificationResult>;
    /**
     * Deep verification - comprehensive analysis, ~60 seconds
     */
    verifyDeep(request: DeepVerifyRequest): Promise<VerificationResult>;
    /**
     * Get verification status for an agent
     */
    getStatus(agentId: string): Promise<VerificationStatus>;
    /**
     * List all verified agents (score >= 60)
     */
    listVerified(): Promise<{
        agents: VerificationStatus[];
        count: number;
    }>;
    /**
     * Generate STARK proof for threshold verification
     */
    generateProof(agentId: string, options?: {
        threshold?: number;
        validityDays?: number;
    }): Promise<StarkProof>;
    /**
     * Verify a STARK proof
     */
    verifyProof(proofHash: string): Promise<{
        valid: boolean;
        details?: any;
    }>;
    /**
     * Submit execution trace for behavioral scoring
     */
    submitTrace(agentId: string, trace: ExecutionTrace): Promise<{
        traceId: string;
        behavioralScore: number;
        totalBonus: number;
    }>;
    /**
     * Get traces for an agent
     */
    getTraces(agentId: string): Promise<{
        agentId: string;
        traces: any[];
        behavioralScore: number;
    }>;
    /**
     * Get NFT badge metadata
     */
    getBadge(agentId: string): Promise<{
        eligible: boolean;
        minted: boolean;
        metadata?: any;
    }>;
    /**
     * Get Pyth price feed
     */
    getPythPrice(symbol: string): Promise<{
        symbol: string;
        price: string;
        confidence: number;
        source: string;
    }>;
    /**
     * Get Jito tip estimate
     */
    getJitoTip(urgency?: 'low' | 'medium' | 'high' | 'urgent'): Promise<{
        estimatedTip: number;
        tipAccounts: string[];
    }>;
    /**
     * Check if agent uses Solana Agent Kit
     */
    detectAgentKit(agentId: string, packageJson: any): Promise<{
        usesAgentKit: boolean;
        detectedPlugins: string[];
        scoreBoost: number;
    }>;
}
export default PoAClient;
//# sourceMappingURL=client.d.ts.map