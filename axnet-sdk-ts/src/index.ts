import { VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { AxnetResponse, HandshakeData } from './types';

export interface AxnetSwapParams {
    userPublicKey: string;
    inputMint: string;
    inputDecimals: number;
    outputMint: string;
    amount: string | number;
    slippageBps?: number;
}

export class AxnetSDK {
    constructor(private baseUrl: string = 'https://api.axnet.fun') { }

    /**
     * Executes the full x402 swap flow: 
     * 1. Get Payloads -> 2. Sign -> 3. Relay Signatures
     */
    async swap(
        params: AxnetSwapParams,
        signAllTransactions: (txs: VersionedTransaction[]) => Promise<VersionedTransaction[]>,
        onHandshake?: (data: HandshakeData) => Promise<void> | void
    ) {
        // --- STEP 1: Get Transactions & x402 Headers ---
        const response = await fetch(`${this.baseUrl}/swap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });

        if (!response.ok) throw new Error(`Axnet Error: ${response.statusText}`);

        const payload: AxnetResponse = await response.json();
        const { transactions } = payload;

        // Grab the critical x402 IDs from headers
        const x402id = response.headers.get("x-402-id");
        const agentId = response.headers.get("x-402-agent-id");

        // --- INTERCEPTOR: Call your middle function if provided ---
        if (onHandshake) {
            const handshakeData: HandshakeData = {
                payload,
                headers: {
                    x402id: x402id,
                    agentId: agentId
                }
            };

            await onHandshake(handshakeData);
        }

        // --- STEP 2: Deserialize & Sign ---
        const tx1 = VersionedTransaction.deserialize(Buffer.from(transactions.feeTx, 'base64'));
        const tx2 = VersionedTransaction.deserialize(Buffer.from(transactions.swapTx, 'base64'));

        const signedTxs = await signAllTransactions([tx1, tx2]);

        // --- STEP 3: Relay Signatures to Execute ---
        const response2 = await fetch(`${this.baseUrl}/swap`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-402-id': x402id ?? '',
            },
            body: JSON.stringify({
                signatures: {
                    feeTx: Buffer.from(signedTxs[0].serialize()).toString('base64'),
                    swapTx: Buffer.from(signedTxs[1].serialize()).toString('base64')
                }
            })
        });

        if (!response2.ok) throw new Error("Axnet Execution Failed");

        return await response2.json();
    }
}