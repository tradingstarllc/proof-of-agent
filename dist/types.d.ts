/**
 * Core types for Proof-of-Agent SDK
 */
export type VerificationLevel = 'basic' | 'standard' | 'comprehensive';
export type VerificationTier = 'excellent' | 'good' | 'fair' | 'needs-work';
export type AgentCapability = 'trading' | 'analysis' | 'social' | 'defi' | 'automation' | 'governance' | 'nft' | 'gaming';
export interface VerificationRequest {
    agentId: string;
    agentName?: string;
    apiEndpoint?: string;
    capabilities?: AgentCapability[];
    testLevel?: VerificationLevel;
    walletAddress?: string;
    codeUrl?: string;
    documentation?: boolean;
    testCoverage?: number;
    codeLines?: number;
}
export interface VerificationResult {
    id: string;
    agentId: string;
    agentName?: string;
    status: 'pending' | 'testing' | 'verified' | 'failed';
    score: number;
    tier: VerificationTier;
    checks: Record<string, boolean>;
    details?: Record<string, string>;
    attestation?: AttestationInfo;
    behavioral?: BehavioralScore;
    createdAt: string;
    completedAt?: string;
    expiresAt?: string;
}
export interface AttestationInfo {
    hash: string;
    signature?: string;
    slot?: number;
    validUntil: string;
    expiresAt: string;
    onChain: boolean;
}
export interface BehavioralScore {
    bonus: number;
    traceCount: number;
    lastTraceAt?: string;
    avgSuccessRate?: number;
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
        avgResponseTime?: number;
    };
    actions?: TraceAction[];
}
export interface TraceAction {
    type: string;
    timestamp: string;
    success: boolean;
    responseTime?: number;
    metadata?: Record<string, any>;
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
        agentIdHash: string;
        timestampVerified: number;
    };
    metadata: {
        prover: string;
        field: string;
        security: number;
    };
}
export interface BadgeMetadata {
    name: string;
    symbol: string;
    description: string;
    image: string;
    attributes: Array<{
        trait_type: string;
        value: string | number;
    }>;
    external_url: string;
}
export interface EcosystemBonus {
    pyth: boolean;
    jito: boolean;
    agentKit: boolean;
    agentKitPlugins: string[];
    totalBonus: number;
}
export interface PoAError {
    error: string;
    code?: string;
    details?: Record<string, any>;
}
export declare function calculateTier(score: number): VerificationTier;
export declare const SCORE_WEIGHTS: {
    hasGithub: number;
    hasApiEndpoint: number;
    capabilityCount: number;
    codeLines: number;
    hasDocumentation: number;
    testCoverage: number;
    usesPyth: number;
    usesJito: number;
    usesAgentKit: number;
    agentKitPlugin: number;
    behavioralMax: number;
};
//# sourceMappingURL=types.d.ts.map