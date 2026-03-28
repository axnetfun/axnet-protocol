# 🚀 Axnet x402 ElizaOS Plugin

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/axnet-protocol/plugin-axnet)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Protocol: x402](https://img.shields.io/badge/Protocol-x402-green.svg)](https://axnet.fun)

The official ElizaOS implementation for the **Axnet Protocol**. This plugin enables autonomous agents to perform stateless, non-custodial token swaps on Solana using the **x402 "Double-Barrel" Atomic Handshake**.

---

## 🏛️ Overview

Axnet removes the friction of API keys and custodial risk for AI agents. By utilizing the x402 standard, agents can sign both a service fee and a Jupiter-routed swap in a single atomic bundle, processed by the Axnet Facilitator.

* **Stateless:** No user accounts or API keys required.
* **Atomic:** Dual-transaction signing (Fee + Execution) via `signAllTransactions`.
* **Verified:** Fully integrated with the **Solana Agent Registry (SAR)**.
* **Registry ID:** `DEpPuMuVZGUAJtN5gVxUNFQUL8jsjF26T781gMT1twE`

---

## 🏗️ Technical Architecture

This plugin follows the **ElizaOS 2026 Modular Template**, separating concerns into three distinct layers:

1.  **AxnetAction (`AXNET_SWAP`):** Orchestrates the 402 "Payment Required" handshake. It handles the challenge-response logic, deserializes transactions via `@solana/web3.js`, and performs atomic signing.
2.  **AxnetProvider:** Injects protocol identity, trust status, and the Axnet Registry ID directly into the agent's context.
3.  **AxnetService:** Manages the plugin lifecycle, API health checks, and connectivity status.

---

## ⚙️ Configuration

Add the following to your agent's `.env` file or character settings:

```bash
AXNET_API_URL=[https://api.axnet.fun/swap](https://api.axnet.fun/swap)
AXNET_REGISTRY_ID=DEpPuMuVZGUAJtN5gVxUNFQUL8jsjF26T781gMT1twE
```

---

## 🛠️ How it Works (The x402 Handshake)

1.  **Intent:** The agent identifies a swap intent (e.g., "Swap 1 SOL for USDC").
2.  **Challenge:** The agent sends a POST to Axnet and receives a **402 Payment Required** status with an `x-402-id` session header and two base64-encoded transactions.
3.  **Atomic Signing:** The agent uses the `walletProvider` to sign both the Fee and the Execution transactions simultaneously.
4.  **Settlement:** The agent retries the POST request, including the `x-402-id` and the generated signatures in the headers.
5.  **Execution:** Axnet verifies the signatures and broadcasts the atomic bundle to the Solana mainnet.

---

## 🚀 Installation & Usage

### 1. Install
```bash
bun add @elizaos/plugin-axnet
```

### 2. Register Plugin

In your `character.ts` or `index.ts`:

```typescript
import { axnetPlugin } from "@elizaos/plugin-axnet";

const agent = new Agent({
  plugins: [axnetPlugin],
  // ... other config
});
```

### 3. Usage

Ask your agent:
* "Swap 0.5 SOL for BONK via Axnet"
* "Trade 100 USDC for SOL with 1% slippage"

---

## 🧪 Development & Testing

This plugin features a robust test suite that mocks the Solana `VersionedTransaction` and the x402 handshake logic, allowing for full verification without network dependency.

```bash
# Install dependencies
bun install

# Run the test suite (Bun native)
bun test

# Build for production
bun run build
```

---

## 📜 License

MIT - Built for the Solana Agentic Economy 2026.
