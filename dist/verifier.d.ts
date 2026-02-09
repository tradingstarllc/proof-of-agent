interface VerificationResult {
    score: number;
    checks: Record<string, boolean>;
    details: Record<string, string>;
}
export declare function verifyAgent(endpoint: string, capabilities: string[], level: string): Promise<VerificationResult>;
export {};
//# sourceMappingURL=verifier.d.ts.map