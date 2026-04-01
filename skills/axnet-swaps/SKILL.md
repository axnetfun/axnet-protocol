## ⌨️ Implementation Logic
When using the `axnet-sdk-ts`, follow this structural pattern:

1. **Initialize:** `const sdk = new AxnetSDK();`
2. **The Swap Call:** Use `sdk.swap()` with three distinct arguments:
   - **Params:** The swap details (Mints, Amount, Slippage).
   - **Signer:** A callback function to sign the `VersionedTransaction[]`.
   - **Handshake:** A callback to process x402 headers (AgentID & SessionID).

## 🛡️ Critical Reasoning for AI
- If the swap fails with a "Blockhash" error, the SDK will re-trigger the Signer callback. Be prepared to sign multiple times if the network is congested.
- Ensure `inputDecimals` matches the Solana on-chain metadata for the input mint.
