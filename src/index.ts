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
  <title>MoltLaunch — Solana Agent Validation Protocol</title>
  <meta name="description" content="Hardware-anchored identity, STARK proofs, and DePIN attestation for AI agents on Solana.">
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
    .container { max-width: 700px; text-align: center; }
    h1 { font-size: 2.5rem; margin-bottom: 8px; }
    .green { color: #14F195; }
    .purple { color: #9945FF; }
    .subtitle { color: #a1a1aa; margin-bottom: 32px; font-size: 1.1rem; line-height: 1.6; }
    .card { background: #27272a; border-radius: 12px; padding: 24px; margin-bottom: 20px; text-align: left; }
    .card h3 { color: #14F195; margin-bottom: 12px; }
    code { background: #09090b; padding: 2px 6px; border-radius: 4px; font-size: 0.9rem; color: #14F195; }
    pre { background: #09090b; padding: 16px; border-radius: 8px; overflow-x: auto; margin-top: 12px; font-size: 0.8rem; line-height: 1.5; }
    .endpoints { list-style: none; }
    .endpoints li { padding: 6px 0; border-bottom: 1px solid #3f3f46; font-size: 0.9rem; }
    .endpoints li:last-child { border: none; }
    .method { display: inline-block; width: 50px; font-weight: 600; font-size: 0.8rem; }
    .get { color: #4ade80; }
    .post { color: #22d3ee; }
    .stats { display: flex; gap: 16px; justify-content: center; margin-bottom: 28px; flex-wrap: wrap; }
    .stat { text-align: center; background: #27272a; border-radius: 10px; padding: 16px 20px; min-width: 100px; }
    .stat-value { font-size: 1.5rem; font-weight: 700; background: linear-gradient(135deg, #14F195, #9945FF); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .stat-label { font-size: 0.7rem; color: #71717a; margin-top: 4px; }
    a { color: #14F195; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .footer { margin-top: 24px; color: #71717a; font-size: 0.8rem; line-height: 1.8; }
    .badge { display: inline-block; background: rgba(20,241,149,0.1); border: 1px solid rgba(20,241,149,0.3); color: #14F195; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; margin-bottom: 16px; }
    .trust-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 0.85rem; }
    .trust-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .trust-cost { margin-left: auto; color: #71717a; font-size: 0.8rem; }
    .links { display: flex; gap: 12px; justify-content: center; margin-top: 20px; flex-wrap: wrap; }
    .links a { background: rgba(20,241,149,0.1); border: 1px solid rgba(20,241,149,0.3); padding: 8px 16px; border-radius: 8px; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">Solana Agent Protocol (SAP) · sRFC #9</div>
    <h1>🔐 <span class="green">Molt</span><span class="purple">Launch</span></h1>
    <p class="subtitle">
      Hardware-anchored identity, STARK proofs, and DePIN attestation.<br>
      Making Sybil attacks cost <strong>$500/month</strong> instead of <strong>$0</strong>.
    </p>
    
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${verifications.size}</div>
        <div class="stat-label">Verifications</div>
      </div>
      <div class="stat">
        <div class="stat-value">14</div>
        <div class="stat-label">Anchor Instructions</div>
      </div>
      <div class="stat">
        <div class="stat-value">v2.4</div>
        <div class="stat-label">SDK</div>
      </div>
      <div class="stat">
        <div class="stat-value">5</div>
        <div class="stat-label">Trust Levels</div>
      </div>
    </div>
    
    <div class="card">
      <h3>Trust Ladder — Anti-Sybil</h3>
      <div class="trust-row"><span class="trust-dot" style="background:#ef4444"></span> Level 0-2: Wallet / API key / Code hash <span class="trust-cost">$0</span></div>
      <div class="trust-row"><span class="trust-dot" style="background:#fbbf24"></span> Level 3: Hardware fingerprint <span class="trust-cost">$100/mo</span></div>
      <div class="trust-row"><span class="trust-dot" style="background:#14F195"></span> Level 4: TPM challenge-response <span class="trust-cost">$200/mo</span></div>
      <div class="trust-row"><span class="trust-dot" style="background:#9945FF"></span> Level 5: DePIN device (io.net, Helium) <span class="trust-cost">$500+/mo</span></div>
    </div>
    
    <div class="card">
      <h3>Core Endpoints</h3>
      <ul class="endpoints">
        <li><span class="method post">POST</span> <code>/api/verify</code> — Verify agent (PoA score 0-100)</li>
        <li><span class="method post">POST</span> <code>/api/validate</code> — Unified SAP validation</li>
        <li><span class="method post">POST</span> <code>/api/identity/register</code> — Register hardware identity</li>
        <li><span class="method post">POST</span> <code>/api/identity/tpm/challenge</code> — TPM attestation</li>
        <li><span class="method post">POST</span> <code>/api/identity/depin</code> — DePIN device binding</li>
        <li><span class="method post">POST</span> <code>/api/identity/table-check</code> — Sybil detection</li>
        <li><span class="method post">POST</span> <code>/api/stark/generate/:id</code> — STARK threshold proof</li>
        <li><span class="method get">GET</span> <code>/api/identity/:id/report</code> — Trust ladder report</li>
        <li><span class="method get">GET</span> <code>/api/health</code> — Health check</li>
      </ul>
    </div>

    <div class="card">
      <h3>Quick Start</h3>
      <pre>npm install @moltlaunch/sdk

import { MoltLaunch } from "@moltlaunch/sdk";
const ml = new MoltLaunch();

// Register hardware identity
const id = await ml.generateIdentity({
  includeHardware: true,
  includeTPM: true,
  agentId: "my-agent",
  anchor: true
});

// Verify
const result = await ml.verify({
  agentId: "my-agent",
  capabilities: ["trading"]
});

// Prove score >= 60 (without revealing score)
const proof = await ml.generateProof("my-agent", { threshold: 60 });</pre>
    </div>
    
    <div class="links">
      <a href="https://youragent.id">🌐 Main Site</a>
      <a href="https://youragent.id/pitch.html">📊 Pitch</a>
      <a href="https://youragent.id/skill.md">📄 skill.md</a>
      <a href="https://github.com/tradingstarllc/solana-agent-protocol">📋 SAP Spec</a>
      <a href="https://www.npmjs.com/package/@moltlaunch/sdk">📦 npm</a>
    </div>
    
    <p class="footer">
      <a href="https://youragent.id">MoltLaunch</a> — Solana Agent Validation Protocol<br>
      <a href="https://github.com/tradingstarllc/solana-agent-protocol">SAP Spec</a> · 
      <a href="https://github.com/solana-foundation/SRFCs/discussions/9">sRFC #9</a> · 
      <a href="https://github.com/tradingstarllc/moltlaunch">GitHub</a><br>
      Built for <a href="https://www.colosseum.org/">Colosseum Agent Hackathon 2026</a>
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
