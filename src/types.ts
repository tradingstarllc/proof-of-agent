/**
 * Core types for Proof-of-Agent SDK
 */

// Verification Levels
export type VerificationLevel = 'basic' | 'standard' | 'comprehensive';

// Verification Tiers
export type VerificationTier = 'excellent' | 'good' | 'fair' | 'needs-work';

// Agent Capabilities
export type AgentCapability = 
  | 'trading' 
  | 'analysis' 
  | 'social' 
  | 'defi' 
  | 'automation'
  | 'governance'
  | 'nft'
  | 'gaming';

// Verification Request
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

// Verification Result
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

// Attestation Info
export interface AttestationInfo {
  hash: string;
  signature?: string;
  slot?: number;
  validUntil: string;
  expiresAt: string;
  onChain: boolean;
}

// Behavioral Score
export interface BehavioralScore {
  bonus: number;
  traceCount: number;
  lastTraceAt?: string;
  avgSuccessRate?: number;
}

// Execution Trace
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

// Individual Action in Trace
export interface TraceAction {
  type: string;
  timestamp: string;
  success: boolean;
  responseTime?: number;
  metadata?: Record<string, any>;
}

// STARK Proof
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

// Badge Metadata (NFT)
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

// Ecosystem Integrations
export interface EcosystemBonus {
  pyth: boolean;
  jito: boolean;
  agentKit: boolean;
  agentKitPlugins: string[];
  totalBonus: number;
}

// API Error
export interface PoAError {
  error: string;
  code?: string;
  details?: Record<string, any>;
}

// Score Calculation
export function calculateTier(score: number): VerificationTier {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'needs-work';
}

// Score Weights
export const SCORE_WEIGHTS = {
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
