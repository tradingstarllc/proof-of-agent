import express from 'express';
import cors from 'cors';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { verifyAgent } from './verifier';
import { createAttestation } from './attestation';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory store (replace with DB in production)
const verifications = new Map<string, VerificationResult>();

interface VerificationRequest {
  agentName: string;
  apiEndpoint: string;
  capabilities: string[];
  testLevel: 'basic' | 'standard' | 'comprehensive';
  walletAddress?: string;
}

interface VerificationResult {
  id: string;
  agentName: string;
  status: 'pending' | 'testing' | 'verified' | 'failed';
  score: number;
  checks: Record<string, boolean>;
  attestationTx?: string;
  createdAt: string;
  completedAt?: string;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    service: 'Proof-of-Agent Verification',
    version: '1.0.0',
    status: 'operational',
    verificationsProcessed: verifications.size
  });
});

// Submit verification request
app.post('/api/verify', async (req, res) => {
  const { agentName, apiEndpoint, capabilities, testLevel, walletAddress }: VerificationRequest = req.body;

  // Validation
  if (!agentName || !apiEndpoint) {
    return res.status(400).json({ error: 'agentName and apiEndpoint required' });
  }

  const id = `poa-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
  
  const result: VerificationResult = {
    id,
    agentName,
    status: 'pending',
    score: 0,
    checks: {},
    createdAt: new Date().toISOString()
  };

  verifications.set(id, result);

  // Start async verification
  runVerification(id, apiEndpoint, capabilities || [], testLevel || 'basic', walletAddress);

  res.json({
    verificationId: id,
    status: 'pending',
    message: 'Verification started. Poll /api/status/:id for results.',
    estimatedTime: testLevel === 'comprehensive' ? '5 minutes' : testLevel === 'standard' ? '1 minute' : '10 seconds'
  });
});

// Check verification status
app.get('/api/status/:id', (req, res) => {
  const result = verifications.get(req.params.id);
  
  if (!result) {
    return res.status(404).json({ error: 'Verification not found' });
  }

  res.json(result);
});

// Get score by agent name/address
app.get('/api/score/:agent', (req, res) => {
  const agent = req.params.agent.toLowerCase();
  
  // Find most recent verification for this agent
  let latest: VerificationResult | null = null;
  
  for (const v of verifications.values()) {
    if (v.agentName.toLowerCase() === agent && v.status === 'verified') {
      if (!latest || new Date(v.completedAt!) > new Date(latest.completedAt!)) {
        latest = v;
      }
    }
  }

  if (!latest) {
    return res.status(404).json({ error: 'No verified score found for agent' });
  }

  res.json({
    agent: latest.agentName,
    score: latest.score,
    verifiedAt: latest.completedAt,
    attestationTx: latest.attestationTx
  });
});

// List recent verifications
app.get('/api/verifications', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  
  const results = Array.from(verifications.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  res.json({
    count: results.length,
    total: verifications.size,
    verifications: results
  });
});

// Async verification runner
async function runVerification(
  id: string,
  endpoint: string,
  capabilities: string[],
  level: string,
  walletAddress?: string
) {
  const result = verifications.get(id)!;
  result.status = 'testing';
  verifications.set(id, result);

  try {
    const verification = await verifyAgent(endpoint, capabilities, level);
    
    result.score = verification.score;
    result.checks = verification.checks;
    result.status = verification.score >= 60 ? 'verified' : 'failed';
    result.completedAt = new Date().toISOString();

    // Create on-chain attestation for verified agents
    if (result.status === 'verified' && walletAddress) {
      try {
        const attestation = await createAttestation(
          result.agentName,
          walletAddress,
          result.score
        );
        result.attestationTx = attestation.signature;
      } catch (e) {
        console.error('Attestation failed:', e);
      }
    }

    verifications.set(id, result);
  } catch (error: any) {
    result.status = 'failed';
    result.checks = { error: false };
    result.completedAt = new Date().toISOString();
    verifications.set(id, result);
    console.error(`Verification ${id} failed:`, error.message);
  }
}

app.listen(PORT, () => {
  console.log(`Proof-of-Agent API running on port ${PORT}`);
});

export default app;
