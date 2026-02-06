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

// Landing page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proof-of-Agent | MoltLaunch</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #09090b 0%, #18181b 100%);
      color: #fafafa;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container { max-width: 600px; text-align: center; }
    h1 { font-size: 2.5rem; margin-bottom: 8px; }
    .accent { color: #22d3ee; }
    .subtitle { color: #a1a1aa; margin-bottom: 32px; font-size: 1.1rem; }
    .card { background: #27272a; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: left; }
    .card h3 { color: #22d3ee; margin-bottom: 12px; }
    code { background: #09090b; padding: 2px 6px; border-radius: 4px; font-size: 0.9rem; }
    pre { background: #09090b; padding: 16px; border-radius: 8px; overflow-x: auto; margin-top: 12px; font-size: 0.85rem; }
    .endpoints { list-style: none; }
    .endpoints li { padding: 8px 0; border-bottom: 1px solid #3f3f46; }
    .endpoints li:last-child { border: none; }
    .method { display: inline-block; width: 60px; color: #4ade80; font-weight: 600; }
    .stats { display: flex; gap: 24px; justify-content: center; margin-bottom: 24px; }
    .stat { text-align: center; }
    .stat-value { font-size: 2rem; font-weight: 700; color: #22d3ee; }
    .stat-label { font-size: 0.85rem; color: #71717a; }
    a { color: #22d3ee; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .footer { margin-top: 32px; color: #71717a; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 <span class="accent">Proof-of-Agent</span></h1>
    <p class="subtitle">Verification API for AI Agent Token Launches</p>
    
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${verifications.size}</div>
        <div class="stat-label">Verifications</div>
      </div>
      <div class="stat">
        <div class="stat-value">v1.0</div>
        <div class="stat-label">Version</div>
      </div>
    </div>
    
    <div class="card">
      <h3>API Endpoints</h3>
      <ul class="endpoints">
        <li><span class="method">POST</span> <code>/api/verify</code> — Submit agent for verification</li>
        <li><span class="method">GET</span> <code>/api/status/:id</code> — Check verification status</li>
        <li><span class="method">GET</span> <code>/api/score/:agentId</code> — Get agent score</li>
        <li><span class="method">GET</span> <code>/api/verifications</code> — List all verifications</li>
        <li><span class="method">GET</span> <code>/api/health</code> — Health check</li>
      </ul>
    </div>
    
    <div class="card">
      <h3>Quick Start</h3>
      <pre>curl -X POST ${req.protocol}://${req.get('host')}/api/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentName": "MyAgent",
    "apiEndpoint": "https://my-agent.com/api",
    "capabilities": ["trading", "analysis"]
  }'</pre>
    </div>
    
    <p class="footer">
      Part of <a href="https://web-production-419d9.up.railway.app">MoltLaunch</a> — 
      AI Agent Launchpad on Solana
    </p>
  </div>
</body>
</html>
  `);
});

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
