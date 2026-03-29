import { AxnetSDK } from '../src'; // or '@axnetfun/sdk' after publishing
import { Keypair, VersionedTransaction } from '@solana/web3.js';
import { HandshakeData } from '../src/types';

async function startAgentSwap() {
    const sdk = new AxnetSDK(); // Defaults to https://api.axnet.fun

    // In a real agent, this would be loaded from an ENV or Secret
    const agentWallet = Keypair.generate();

    console.log("🛠️ Axnet Agent initialized...");

    try {
        const receipt = await sdk.swap(
            {
                userPublicKey: agentWallet.publicKey.toBase58(),
                inputMint: "So11111111111111111111111111111111111111112", // SOL
                inputDecimals: 9,
                outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
                amount: "0.05",
                slippageBps: 50
            },
            // --- The Signer Function ---
            async (txs: VersionedTransaction[]) => {
                console.log("✍️ Signing dual-transaction payload...");
                txs.forEach(tx => tx.sign([agentWallet]));
                return txs;
            },
            // --- The Handshake Callback ---
            async (data: HandshakeData) => {
                console.log(`📡 Handshake Received!`);
                console.log(`🆔 Agent ID: ${data.headers.agentId}`);
                console.log(`🔗 x402 Session: ${data.headers.x402id}`);
                console.log(`🛰️ Payload: ${data.payload}`);
            }
        );

        console.log("✅ Swap Executed Successfully!");
        console.log("🔗 Signature:", receipt.signature);

    } catch (error) {
        console.error("❌ Swap Failed:", error);
    }
}

startAgentSwap();