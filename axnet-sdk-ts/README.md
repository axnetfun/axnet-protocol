# @axnetfun/sdk-ts 🛰️

The official TypeScript SDK for **Axnet**, the first stateless, x402-powered swap gateway for Solana Agents. 

Axnet abstracts the complexity of the x402 "Payment Required" handshake, allowing agents to execute dual-transaction swaps (Fee + Jupiter) without needing a local RPC connection or complex transaction management.

## 🧱 Key Features

- **Stateless & RPC-less**: Execute swaps without a `Connection` object. No Helius/Quicknode API keys required.
- **x402 Optimized**: Built-in handling for the x402 dual-transaction handshake.
- **Managed Local Signing**: Keep your private keys in your own environment while Axnet handles the relay.
- **One-Ping Execution**: Get both signatures and relay them back to a unified endpoint in a single logical flow.

## 🚀 Quickstart

### Installation

```bash
npm install @axnetfun/sdk-ts
```

## 🚀 Basic Usage

The following example demonstrates how to execute a swap using a local `Keypair`. Note that no RPC `Connection` is required, as Axnet handles the broadcast.

```typescript
import { AxnetSDK } from '@axnetfun/sdk-ts';
import { Keypair } from '@solana/web3.js';

// 1. Initialize the Stateless SDK
const sdk = new AxnetSDK();

// 2. Load your Agent Keypair (Private Key stays local)
const agentWallet = Keypair.fromSecretKey(Uint8Array.from([/* your secret key */]));

async function executeAgentSwap() {
    try {
        const result = await sdk.swap(
            {
                userPublicKey: agentWallet.publicKey.toBase58(),
                inputMint: "So11111111111111111111111111111111111111112", // SOL
                inputDecimals: 9,
                outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
                amount: "0.1", // Swap 0.1 SOL
                slippageBps: 50
            },
            // --- Signer Logic: Purely Local ---
            async (txs) => {
                console.log("✍️ Signing dual-transaction payload locally...");
                txs.forEach(tx => tx.sign([agentWallet]));
                return txs;
            },
            // --- Handshake Hook: Inspect the x402 Metadata ---
            async (data) => {
                console.log(`📡 Handshake Received!`);
                console.log(`🆔 Agent ID: ${data.headers.agentId}`);
                console.log(`🔗 x402 Session: ${data.headers.x402id}`);
                console.log(`🛰️ Payload: ${JSON.stringify(data.payload, null, 2)}`);
            }
        );

        console.log("🎉 Swap Success! Signature:", result.signature);
    } catch (error) {
        console.error("❌ Axnet Execution Failed:", error);
    }
}

executeAgentSwap();
```

## 🏗️ SDK Architecture

The Axnet SDK implements a **Stateless Dual-Hop** architecture. It abstracts the complexity of the x402 "Payment Required" handshake into a single logical execution block.

```typescript
/**
 * CONCEPTUAL FLOW:
 * 1. [SDK] -- POST /swap (Intent) --> [Axnet API]
 * 2. [SDK] <-- 402 + Unsigned Txs -- [Axnet API]
 * 3. [SDK] -- Local Sign (onHandshake) -- [Agent Wallet]
 * 4. [SDK] -- POST /swap (Signed + x-402-id) --> [Axnet API]
 * 5. [SDK] <-- 200 + Signature ----- [Axnet API]
 */
```

## 🛠️ How it Works

The Axnet SDK implements a **Stateless Dual-Hop** architecture. It abstracts the complexity of the x402 "Payment Required" handshake into a single logical execution block.

1.  **Handshake Interceptor**: The SDK automatically catches the `402 Payment Required` response from the first call. It extracts the `x-402-id` and `x-402-agent-id` from the headers to maintain session state without a database.
2.  **Stateless Signing**: The SDK is entirely agnostic to the blockchain. It receives raw transaction bytes from the server, allows your local wallet to sign them, and relays the signatures back.
3.  **Unified Routing**: Both the "Quote" and "Execution" phases hit the same `/swap` endpoint. The server differentiates the requests based on the presence of the `x-402-id` header.

## 📄 API Reference

### `AxnetSDK`

| Method | Parameters | Returns |
| :--- | :--- | :--- |
| `swap` | `(params, signer, onHandshake?)` | `Promise<AxnetResponse>` |

#### `AxnetSwapParams`
- `userPublicKey`: The base58 address of the swapping wallet.
- `inputMint`: Source token mint address.
- `inputDecimals`: Decimal precision of the input token (9 for SOL, 6 for USDC).
- `outputMint`: Destination token mint address.
- `amount`: String or Number (human-readable format).
- `slippageBps`: (Optional) Slippage in basis points (e.g., 50 = 0.5%).

## 🛡️ Security

- **Private Keys**: Never transmitted to the Axnet API. Signing is performed strictly within your agent's local runtime.
- **RPC Privacy**: Axnet acts as a shielded gateway. Your agent's IP and trading patterns are never directly exposed to public RPC providers.
- **Dual-Tx Atomicity**: The architecture ensures the fee and swap are linked, protecting the agent from paying fees on non-executable swaps.

---
**Registry ID**: `DEpPuMuVZGUAJtN5gVxUNFQUL8jsjF26T781gMT1twE`  
