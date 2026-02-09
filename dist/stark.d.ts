/**
 * STARK Proof Generation for Privacy-Preserving Verification
 * Uses M31 field (Mersenne-31) and Poseidon hash
 */
/**
 * M31 Field arithmetic operations
 */
export declare const M31: {
    PRIME: bigint;
    mod(n: bigint): bigint;
    add(a: bigint, b: bigint): bigint;
    sub(a: bigint, b: bigint): bigint;
    mul(a: bigint, b: bigint): bigint;
    pow(base: bigint, exp: bigint): bigint;
    inv(a: bigint): bigint;
};
/**
 * Poseidon hash (simplified for demonstration)
 * In production, use a proper Poseidon implementation
 */
export declare function poseidonHash(inputs: bigint[]): bigint;
/**
 * Verification Circuit for threshold proofs
 */
export interface CircuitInputs {
    score: number;
    threshold: number;
    timestamp: number;
    agentIdHash: bigint;
}
export interface CircuitOutputs {
    meetsThreshold: boolean;
    commitment: bigint;
    constraintsSatisfied: boolean;
}
export declare function evaluateCircuit(inputs: CircuitInputs): CircuitOutputs;
/**
 * Generate execution trace for STARK proof
 */
export interface ExecutionTrace {
    states: bigint[][];
    length: number;
}
export declare function generateExecutionTrace(inputs: CircuitInputs): ExecutionTrace;
/**
 * Generate STARK proof (simplified)
 * In production, use a real STARK prover like STWO
 */
export interface StarkProof {
    commitment: string;
    trace: string;
    proofHash: string;
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
export declare function generateStarkProof(inputs: CircuitInputs): StarkProof;
/**
 * Verify STARK proof
 */
export declare function verifyStarkProof(proof: StarkProof): boolean;
/**
 * Convert agent ID to field element
 */
export declare function agentIdToFieldElement(agentId: string): bigint;
//# sourceMappingURL=stark.d.ts.map