/**
 * PoA Client - SDK for Proof-of-Agent verification
 */

import axios, { AxiosInstance } from 'axios';

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

export class PoAClient {
  private http: AxiosInstance;
  private options: PoAClientOptions;

  constructor(options: PoAClientOptions = {}) {
    this.options = {
      network: options.network || 'devnet',
      ...options
    };

    const baseUrl = options.baseUrl || 
      (options.network === 'mainnet' 
        ? 'https://api.moltlaunch.com'  // Future mainnet
        : 'https://web-production-419d9.up.railway.app');

    this.http = axios.create({
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
  async verifyQuick(request: QuickVerifyRequest): Promise<VerificationResult> {
    const response = await this.http.post('/api/verify/quick', request);
    return response.data;
  }

  /**
   * Deep verification - comprehensive analysis, ~60 seconds
   */
  async verifyDeep(request: DeepVerifyRequest): Promise<VerificationResult> {
    const response = await this.http.post('/api/verify/deep', request);
    return response.data;
  }

  /**
   * Get verification status for an agent
   */
  async getStatus(agentId: string): Promise<VerificationStatus> {
    const response = await this.http.get(`/api/verify/status/${encodeURIComponent(agentId)}`);
    return response.data;
  }

  /**
   * List all verified agents (score >= 60)
   */
  async listVerified(): Promise<{ agents: VerificationStatus[]; count: number }> {
    const response = await this.http.get('/api/verify/list');
    return response.data;
  }

  /**
   * Generate STARK proof for threshold verification
   */
  async generateProof(
    agentId: string, 
    options: { threshold?: number; validityDays?: number } = {}
  ): Promise<StarkProof> {
    const response = await this.http.post(`/api/stark/generate/${encodeURIComponent(agentId)}`, {
      threshold: options.threshold || 60,
      validityDays: options.validityDays || 30
    });
    return response.data;
  }

  /**
   * Verify a STARK proof
   */
  async verifyProof(proofHash: string): Promise<{ valid: boolean; details?: any }> {
    const response = await this.http.post('/api/stark/verify', { proofHash });
    return response.data;
  }

  /**
   * Submit execution trace for behavioral scoring
   */
  async submitTrace(agentId: string, trace: ExecutionTrace): Promise<{
    traceId: string;
    behavioralScore: number;
    totalBonus: number;
  }> {
    const response = await this.http.post('/api/traces', { agentId, trace });
    return response.data;
  }

  /**
   * Get traces for an agent
   */
  async getTraces(agentId: string): Promise<{
    agentId: string;
    traces: any[];
    behavioralScore: number;
  }> {
    const response = await this.http.get(`/api/traces/${encodeURIComponent(agentId)}`);
    return response.data;
  }

  /**
   * Get NFT badge metadata
   */
  async getBadge(agentId: string): Promise<{
    eligible: boolean;
    minted: boolean;
    metadata?: any;
  }> {
    const response = await this.http.get(`/api/badge/${encodeURIComponent(agentId)}`);
    return response.data;
  }

  /**
   * Get Pyth price feed
   */
  async getPythPrice(symbol: string): Promise<{
    symbol: string;
    price: string;
    confidence: number;
    source: string;
  }> {
    const response = await this.http.get(`/api/oracles/pyth/price/${encodeURIComponent(symbol)}`);
    return response.data;
  }

  /**
   * Get Jito tip estimate
   */
  async getJitoTip(urgency: 'low' | 'medium' | 'high' | 'urgent' = 'medium'): Promise<{
    estimatedTip: number;
    tipAccounts: string[];
  }> {
    const response = await this.http.get(`/api/mev/jito/tip-estimate?urgency=${urgency}`);
    return {
      estimatedTip: response.data.estimatedTip,
      tipAccounts: response.data.tipAccountsSample
    };
  }

  /**
   * Check if agent uses Solana Agent Kit
   */
  async detectAgentKit(agentId: string, packageJson: any): Promise<{
    usesAgentKit: boolean;
    detectedPlugins: string[];
    scoreBoost: number;
  }> {
    const response = await this.http.post('/api/verify/agent-kit', {
      agentId,
      packageJson
    });
    return response.data;
  }
}

// Default export
export default PoAClient;
