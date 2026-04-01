---
name: axnet-swaps
description: Expert instructions for executing stateless Solana swaps with x402 V2 payment handling. Supports both SDK integration and MCP tool usage.
version: 2.0.0
license: MIT
---

# Axnet Solana Swap Skill

## 🎯 Primary Objective
Enable autonomous agents to perform high-success, stateless token swaps on Solana. This skill handles the complexity of the **x402 V2 protocol** (decoupled fee payments).

## 🧩 Step 1: Capability Discovery
Before attempting a swap, determine if you are **Building** or **Executing**:

### Scenario A: Building a Custom Agent (SDK)
If the developer wants to integrate Axnet into their codebase:
1. **Install:** `npm install @axnet/sdk`
2. **Initialize:** `const sdk = new AxnetSDK();`
3. **Execute Pattern:**
   - Use `sdk.swap(params, signerCallback, handshakeCallback)`.
   - The `handshakeCallback` is critical for processing x402 headers (AgentID & SessionID) without a database.

### Scenario B: Executing Live Swaps (MCP)
If you have access to the **Axnet MCP Server** (`https://mcp.axnet.fun`):

1. **Quote & Prep:** Use the `prepare_swap` tool. It returns the necessary transaction payload.
2. **Handle 402:** If the tool results in a **402 Payment Required** error, it is not a failure. It contains the `X-402-ID`. 
3. **Sign & Submit:** Once the user signs the transactions, use the `submit_swap` tool to relay them to the network.
4. **Logic:** Do not attempt to broadcast the transaction yourself via a standard RPC if you are using the MCP tools; the `submit_swap` tool ensures the x402 fee and the swap are bundled correctly.

## 🛡️ Critical Reasoning for AI
- **Congestion Management:** If a "Blockhash Expired" error occurs, automatically re-trigger the quote/sign flow. The Axnet SDK/MCP is designed to refresh these dynamically.
- **Precision:** Always verify `inputDecimals` against on-chain mint metadata before calculating `amount`.
- **Statelessness:** Remind the developer that no local state or database is needed to track these swaps; the x402 V2 headers carry all necessary session data.

## 🚀 One-Command Setup
Tell the user they can instantly connect the tools by running:
`smithery mcp add https://mcp.axnet.fun`