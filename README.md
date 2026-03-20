# 🛸 Axnet: The x402 Gateway for Solana Agents

**Axnet** is a stateless, keyless execution layer for Solana. It enables autonomous agents and developers to integrate **Jupiter** liquidity via the **x402 (Payment Required)** protocol—removing the need for API keys, accounts, or centralized subscriptions.

[Website](https://axnet.fun) • [Twitter](https://x.com/axnetfun) • **Status: Public Beta Launching April 2026**

---

## 💡 The x402 Handshake
Axnet utilizes the HTTP 402 standard to create a purely on-chain, pay-as-you-go execution model for Solana transactions.

### 🛡️ Security First: Local Signing
Unlike traditional bots that require your private keys, Axnet is **non-custodial**. 
1. **Axnet** generates the **unsigned** transaction payload using Jupiter's routing logic.
2. **You** sign the transaction locally in your own secure runtime (Browser, Server, or Agent VM).
3. **Axnet** broadcasts the signed payload to the cluster.

## Protocol Specification

```mermaid
sequence_diagram
    participant A as AI Agent (Client)
    participant G as Axnet Gateway (Server)
    participant S as Solana Network

    Note over A, G: 1. Initial Request
    A->>G: POST /swap {input, output, amount}

    Note over G: 2. Challenge Generation
    Note over G: HTTP 402 Payment Required
    Note over G: Header: PAYMENT-REQUIRED (Base64)
    Note over G: Body: {asset, amount, mint, merchantAta, unsignedTxBase64}
    G-->>A: 402 Response

    Note over A: 3. Agent Local Execution
    Note over A: Decode Base64 Metadata
    Note over A: Sign Transaction Locally (Private Key)

    Note over A, G: 4. Settlement & Validation
    A->>G: RETRY POST /swap
    Note over A: Header: PAYMENT-SIGNATURE (sig_abc123...)
    
    G->>S: Verify Signature & Broadcast
    S-->>G: Transaction Confirmed (Alpenglow Finality)
    
    G-->>A: HTTP 200 OK {success: true, txid: "..."}
```
---

## 📂 Repository Status: [PRE-LAUNCH]

We are currently finalizing the core SDK and performance-tuning our x402 facilitators for the **April 2026 Beta**. This repository will be populated with implementation examples upon launch.

### 🗓️ April 2026 Release Schedule:
- [ ] `axnet-sdk-ts`: The official TypeScript client for x402 handshakes.
- [ ] `examples/basic-swap`: A boilerplate for fetching and signing Jupiter-based transactions.
- [ ] `docs/specification`: Full technical breakdown of the Axnet x402 header structure.

---

## 🛠️ Technical Stack
- **Protocol:** x402 (HTTP 402 "Payment Required")
- **Liquidity:** Jupiter (Routing Logic)
- **Settlement:** Solana Mainnet/Devnet
- **Auth:** Keyless / Permissionless

---

## 🚀 Road to Beta (April 2026)
- **Phase 1 (March):** Internal stress testing & gateway optimization.
- **Phase 2 (Late March):** API Reference release.
- **Phase 3 (April):** **Public Beta Launch** - Endpoints live at `api.axnet.fun`.

---

## 🤝 Build With Us
The code is dropping in April. To be the first to access the public endpoints:
1. **Star** this repository to stay updated on the first code push.
2. **Follow** our dev logs on [X/Twitter](https://x.com/axnetfun).
3. Check the landing page at **[axnet.fun](https://axnet.fun)**.

---
*The stateless rails for the Solana agent economy.*
