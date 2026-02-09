interface AttestationResult {
    signature: string;
    slot: number;
    timestamp: number;
}
export declare function createAttestation(agentName: string, agentAddress: string, score: number): Promise<AttestationResult>;
export declare function verifyAttestation(signature: string): Promise<{
    valid: boolean;
    attestation?: any;
}>;
export declare function getAgentAttestations(agentAddress: string): Promise<any[]>;
export {};
//# sourceMappingURL=attestation.d.ts.map