> ⚠️ **DEPRECATED:** This package is from MoltLaunch V1 (STARK proof era). The current SDK is `@moltlaunch/sdk` v3.0.0. See https://github.com/tradingstarllc/moltlaunch-sdk

# Proof-of-Agent (PoA) SDK

**Verify AI agents actually work before you trust them.**

[![npm version](https://img.shields.io/npm/v/@moltlaunch/proof-of-agent)](https://www.npmjs.com/package/@moltlaunch/proof-of-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A verification SDK and API for AI agents on Solana. Tests capabilities, issues on-chain attestations, and provides cryptographic proofs.

## The Problem

**85% of AI agent tokens rug** within weeks. Anyone can claim their agent does X, but proving it is hard. Investors lose money. Legitimate agents can't get funded.

## The Solution

Proof-of-Agent (PoA) provides:

1. **Capability Testing** — Standardized challenges for trading, analysis, social, DeFi agents
2. **On-Chain Attestations** — Immutable verification stored on Solana
3. **Privacy-Preserving Proofs** — STARK proofs for "score ≥ threshold" without revealing details
4. **Ecosystem Integration** — Score bonuses for Pyth, Jito, and Agent Kit usage

---

## Quick Start

### Install

```bash
npm install @moltlaunch/proof-of-agent
```

### Verify an Agent

```typescript
import { PoAClient } from '@moltlaunch/proof-of-agent';

const client = new PoAClient({
  network: 'devnet',
  apiKey: 'optional-for-premium'
});

// Quick verification (free, ~10s)
const quick = await client.verifyQuick({
  agentId: 'my-trading-bot',
  apiEndpoint: 'https://my-agent.com/api'
});
console.log(quick.score); // 0-100

// Deep verification (comprehensive, ~60s)
const deep = await client.verifyDeep({
  agentId: 'my-trading-bot',
  apiEndpoint: 'https://my-agent.com/api',
  capabilities: ['trading', 'analysis'],
  codeUrl: 'https://github.com/me/agent',
  documentation: true,
  testCoverage: 80
});
console.log(deep.score);        // 0-100
console.log(deep.attestation);  // On-chain proof
```

### Check Verification Status

```typescript
const status = await client.getStatus('my-trading-bot');
console.log(status.verified);   // true/false
console.log(status.tier);       // 'excellent' | 'good' | 'fair' | 'needs-work'
console.log(status.expiresAt);  // ISO timestamp
```

### Generate STARK Proof

```typescript
// Prove "score ≥ 60" without revealing exact score
const proof = await client.generateProof('my-trading-bot', { threshold: 60 });
console.log(proof.valid);        // true
console.log(proof.meetsThreshold); // true
console.log(proof.proofHash);    // For verification
```

---

## Scoring System

### Base Score (0-100)

| Signal | Points | Description |
|--------|--------|-------------|
| GitHub Repository | 15 | Public codebase |
| Working API | 20 | Responds to requests |
| Capabilities | 5/each | Tested functions |
| Code Lines | 0.3/100 | Substantive code |
| Documentation | 10 | Agent is documented |
| Test Coverage | 0.2/% | Automated tests |

### Ecosystem Bonuses

| Integration | Bonus | Description |
|-------------|-------|-------------|
| Pyth Oracles | +10 | Uses trusted price feeds |
| Jito Bundles | +15 | MEV protection |
| Solana Agent Kit | +5 | Core usage |
| Agent Kit Plugins | +3/each | token, nft, defi, misc, blinks |

### Behavioral Scoring

Agents can submit execution traces over time to earn bonus points:

```typescript
await client.submitTrace('my-trading-bot', {
  period: { start: '2026-02-01', end: '2026-02-07' },
  summary: {
    totalActions: 500,
    successRate: 0.95,
    errorRate: 0.05
  }
});
// Adds up to +25 bonus points
```

### Tiers

| Tier | Score | Badge |
|------|-------|-------|
| Excellent | 80-100 | 💎 |
| Good | 60-79 | 🥇 |
| Fair | 40-59 | 🥈 |
| Needs Work | 0-39 | 🥉 |

---

## API Reference

### Hosted API

Base URL: `https://youragent.id`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/verify/quick` | POST | Quick verification (~10s) |
| `/api/verify/deep` | POST | Deep verification (~60s) |
| `/api/verify/status/:agentId` | GET | Check verification status |
| `/api/verify/list` | GET | List verified agents |
| `/api/stark/generate/:agentId` | POST | Generate STARK proof |
| `/api/badge/:agentId` | GET | Get NFT badge metadata |
| `/api/traces` | POST | Submit execution trace |
| `/api/traces/:agentId` | GET | Get agent traces |

### Standalone Server

Run your own PoA verification server:

```bash
git clone https://github.com/tradingstarllc/proof-of-agent
cd proof-of-agent
npm install
npm run build
npm start
```

Environment variables:
```
PORT=3001
SOLANA_RPC_URL=https://api.devnet.solana.com
PAYER_SECRET_KEY=[...]  # For attestations
```

---

## On-Chain Integration

### Current: Attestation via Memo

Verified agents get a Solana Memo transaction:

```json
{
  "type": "poa",
  "version": "1.0",
  "agent": "my-trading-bot",
  "score": 75,
  "tier": "good",
  "ts": 1707350400
}
```

### Roadmap: PDA for CPI

Future versions will store verification in a PDA that other programs can query via CPI:

```rust
// VerificationPDA (coming soon)
pub struct AgentVerification {
    pub agent_id: [u8; 32],
    pub score: u8,
    pub tier: u8,
    pub verified_at: i64,
    pub expires_at: i64,
    pub attestation_hash: [u8; 32],
}

// PDA seed: ["verification", agent_id]
```

This enables DeFi protocols to trustlessly gate access based on verification status.

---

## Privacy-Preserving Proofs

PoA uses STARK proofs (M31 field, Poseidon hash) to prove verification status without revealing sensitive details.

### What You Can Prove

- "My score is ≥ 60" (threshold proof)
- "I passed verification" (existence proof)
- "My attestation is not expired" (time-bound proof)

### What Stays Private

- Exact score value
- Individual check results
- Code analysis details
- API response contents

---

## Integration Examples

### Require Verification in Your Protocol

```typescript
import { PoAClient } from '@moltlaunch/proof-of-agent';

async function checkAgent(agentId: string): Promise<boolean> {
  const client = new PoAClient({ network: 'mainnet' });
  const status = await client.getStatus(agentId);
  return status.verified && status.score >= 60;
}

// In your protocol
if (!await checkAgent(incomingAgentId)) {
  throw new Error('Agent not verified. Get verified at moltlaunch.com');
}
```

### Verify Before Token Launch

```typescript
// Integration for launchpads
const score = await client.verifyDeep({
  agentId: tokenSymbol,
  apiEndpoint: agentApi,
  capabilities: ['trading']
});

if (score.score < 60) {
  reject('Agent must score 60+ to launch');
}
```

### Display Verification Badge

```html
<!-- Embed verification widget -->
<iframe 
  src="https://youragent.id/badge/my-agent"
  width="200" 
  height="100"
></iframe>
```

---

## Use Cases

| User | Need | Solution |
|------|------|----------|
| **Launchpads** | Filter rug agents | Require 60+ score |
| **DeFi Protocols** | Gate agent access | CPI verification check |
| **Investors** | Due diligence | Check score + attestation |
| **Agent Developers** | Build credibility | Get verified badge |
| **Marketplaces** | Trust rankings | Display verification tier |

---

## Links

- **MoltLaunch API**: https://youragent.id
- **skill.md**: https://youragent.id/skill.md
- **Dashboard**: https://youragent.id/dashboard.html
- **GitHub**: https://github.com/tradingstarllc/proof-of-agent
- **On-Chain AI**: [Devnet Explorer](https://explorer.solana.com/address/FHcy35f4NGZK9b6j5TGMYstfB6PXEtmNbMLvjfR1y2Li?cluster=devnet)

---

## License

MIT © MoltLaunch

Built for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon)
