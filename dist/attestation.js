"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAttestation = createAttestation;
exports.verifyAttestation = verifyAttestation;
exports.getAgentAttestations = getAgentAttestations;
const web3_js_1 = require("@solana/web3.js");
const MEMO_PROGRAM_ID = new web3_js_1.PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
// Create on-chain attestation via Solana Memo program
async function createAttestation(agentName, agentAddress, score) {
    // Use devnet for now (switch to mainnet in production)
    const connection = new web3_js_1.Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
    // Load payer keypair from env (in production, use proper key management)
    const payerSecret = process.env.PAYER_SECRET_KEY;
    if (!payerSecret) {
        throw new Error('PAYER_SECRET_KEY not configured');
    }
    const payer = web3_js_1.Keypair.fromSecretKey(Buffer.from(JSON.parse(payerSecret)));
    // Create attestation memo
    const attestation = {
        type: 'poa',
        version: '1.0',
        agent: agentAddress,
        name: agentName.substring(0, 32), // Limit name length
        score,
        ts: Math.floor(Date.now() / 1000)
    };
    const memoText = JSON.stringify(attestation);
    // Create memo instruction
    const memoInstruction = new web3_js_1.TransactionInstruction({
        keys: [],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memoText)
    });
    // Build and send transaction
    const transaction = new web3_js_1.Transaction().add(memoInstruction);
    const signature = await (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer]);
    const slot = await connection.getSlot();
    return {
        signature,
        slot,
        timestamp: attestation.ts
    };
}
// Verify an existing attestation
async function verifyAttestation(signature) {
    const connection = new web3_js_1.Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
    try {
        const tx = await connection.getTransaction(signature, {
            maxSupportedTransactionVersion: 0
        });
        if (!tx || !tx.meta) {
            return { valid: false };
        }
        // Find memo instruction
        const logs = tx.meta.logMessages || [];
        const memoLog = logs.find(log => log.includes('Program log: Memo'));
        if (!memoLog) {
            return { valid: false };
        }
        // Extract memo data (rough parsing)
        const memoMatch = memoLog.match(/Memo \(len \d+\): "(.*?)"/);
        if (!memoMatch) {
            return { valid: false };
        }
        const attestation = JSON.parse(memoMatch[1]);
        // Verify it's a PoA attestation
        if (attestation.type !== 'poa') {
            return { valid: false };
        }
        return { valid: true, attestation };
    }
    catch (error) {
        return { valid: false };
    }
}
// Query attestations for an agent
async function getAgentAttestations(agentAddress) {
    // In production, this would query an indexer or use getSignaturesForAddress
    // with memo parsing. For now, return empty.
    return [];
}
//# sourceMappingURL=attestation.js.map