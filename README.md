# 🛸 Axnet: The x402 Gateway for Solana Agents

[![npm version](https://img.shields.io/npm/v/@axnetfun/plugin-axnet.svg)](https://www.npmjs.com/package/@axnetfun/plugin-axnet)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![smithery badge](https://smithery.ai/badge/axnet/core)](https://smithery.ai/servers/axnet/core)

**Axnet** is a stateless, keyless execution layer for Solana. It enables autonomous agents to integrate **Jupiter** liquidity via the **x402 (Payment Required)** protocol—removing the need for API keys, accounts, or centralized subscriptions.

[Website](https://axnet.fun) • [Twitter](https://x.com/axnetfun) • **Status: Public Beta Live March 2026**

---

## 🏗️ Verified Identity
Axnet is a registered and verified infrastructure tool on the **ERC-8004 Agent Registry**.
* **Asset ID:** `DEpPuMUvZGHUAJtN5gVxUNFQUL8jsjF26T781gMT1twE`
* **Registry:** [8004.qnt.sh](https://8004.qnt.sh/)
* **Reputation:** Powered by **ATOM Engine** (Tier: **Bronze** - *Indexing Active*)
* **Dispute Resolver:** `solana:8oo4:ATOM-SEAL-v1`

---

## 🔌 ElizaOS Integration (Official Plugin)
The quickest way to deploy Axnet is via our official ElizaOS plugin. It handles the x402 "Double-Barrel" handshake automatically.

### **Installation**
```bash
bun add @elizaos/plugin-axnet
```

### **Configuration**

Add to your agent's `.env`:

```bash
AXNET_API_URL=[https://api.axnet.fun/swap](https://api.axnet.fun/swap)
AXNET_REGISTRY_ID=DEpPuMuVZGUAJtN5gVxUNFQUL8jsjF26T781gMT1twE
```

### **Usage**

Once registered, your agent can naturally handle swap intents:

* "Swap 0.5 SOL for BONK via Axnet"
* "Trade 100 USDC for SOL with 1% slippage"

---

## 🛠️ The Dual-Transaction x402 Handshake

Axnet utilizes the HTTP 402 standard to facilitate secure, non-custodial swaps. Unlike standard gateways, Axnet provides a **Two-Transaction Bundle** that separates the service fee from the liquidity swap.

### **The Protocol Flow**

1. **Intent Request**: Agent sends a swap request to `/swap`.
2. **Challenge**: Axnet returns **HTTP 402 Payment Required**. The body contains **Transaction A (Fee)** and **Transaction B (Swap)**.
3. **Local Signing**: The Agent signs both transactions locally. **Private keys never leave the client.**
4. **Settlement**: The Agent retries the POST with the signed transactions and the `x-402-id` header.
5. **Coordination**: The Axnet Go-engine validates and broadcasts the bundle to the Solana cluster.

---

## 📂 Repository Status: [ALPHA LAUNCH]

The gateway is currently live. We are expanding our SDK support to simplify the dual-transaction signing flow across all agent frameworks.

### 🗓️ March/April 2026 Roadmap:
- [x] **Registry**: Minted 8004 Identity NFT (`DEpPu...1twE`).
- [x] **Gateway**: Dual-transaction execution live at `api.axnet.fun`.
- [x] **ElizaOS Plugin**: Official `@elizaos/plugin-axnet` released.
- [ ] `axnet-sdk-ts`: Official TypeScript client for bundle signing (Coming April 1st).
- [ ] `examples/python-agent`: Implementation for LangChain/AutoGPT.

---

## 🛰️ Technical Stack
- **Protocol**: x402 (HTTP 402 "Payment Required")
- **Registry**: ERC-8004 (Solana Implementation)
- **Reputation**: ATOM Engine (SEAL-v1 Dispute Resolver)
- **Liquidity**: Jupiter Aggregator
- **Backend**: Go (High-concurrency execution engine)

---

## 🤝 Build With Us
1. **Reference** Asset ID `DEpPuMUvZGHUAJtN5gVxUNFQUL8jsjF26T781gMT1twE` in your agent's trust config.
2. **Connect** via [MCP](https://mcp.axnet.fun/sse) or the **ElizaOS Plugin**.
3. **Follow** our dev logs on [X/Twitter](https://x.com/axnetfun).
