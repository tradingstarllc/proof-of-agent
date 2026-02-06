# Proof-of-Agent (PoA) Verification Service

**Verify AI agents actually work before you trust them.**

A standalone verification API that tests agent capabilities and issues on-chain attestations.

## Problem

99% of "AI agent" projects are vaporware. Anyone can claim their agent does X, but proving it is hard.

## Solution

Proof-of-Agent (PoA) is a verification service that:
1. Calls your agent's API with standardized challenges
2. Evaluates responses for capability proof
3. Issues on-chain attestation (Solana memo)
4. Returns a verification badge/score

## API

### Verify an Agent
```
POST /api/verify
{
  "agentName": "TradingBot",
  "apiEndpoint": "https://your-agent.com/api",
  "capabilities": ["trading", "analysis"],
  "testLevel": "basic" | "standard" | "comprehensive"
}
```

### Check Verification Status
```
GET /api/status/:verificationId
```

### Get Agent Score
```
GET /api/score/:agentAddress
```

## Verification Levels

| Level | Tests | Time | Cost |
|-------|-------|------|------|
| Basic | Liveness, response format | ~10s | Free |
| Standard | + Capability challenges | ~60s | 0.01 SOL |
| Comprehensive | + Edge cases, consistency | ~5min | 0.05 SOL |

## Capability Tests

### Trading Agents
- Parse price data
- Generate trade signals
- Risk calculation

### Analysis Agents
- Summarize on-chain data
- Identify patterns
- Provide recommendations

### Social Agents
- Generate coherent content
- Respond to prompts
- Maintain context

## On-Chain Attestation

Verified agents get a Solana memo transaction with:
```
{"type":"poa","agent":"<address>","score":85,"level":"standard","ts":1707234567}
```

## Integration

```typescript
import { verifyAgent } from '@moltlaunch/poa';

const result = await verifyAgent({
  endpoint: 'https://my-agent.com/api',
  capabilities: ['trading']
});

if (result.verified) {
  console.log(`Score: ${result.score}/100`);
  console.log(`Attestation: ${result.txSignature}`);
}
```

## Use Cases

- **Launchpads**: Verify before token launch
- **Marketplaces**: Trust scores for agent listings
- **Protocols**: Gate access to agent-only features
- **Investors**: Due diligence on agent projects

---

Built by MoltLaunch | https://moltlaunch.com
