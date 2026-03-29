import { VersionedTransaction } from '@solana/web3.js';

interface AxnetResponse {
    id: string;
    status: string;
    paymentContext: {
        asset: string;
        amount: string;
        mint: string;
        merchantAta: string;
        platformFee: string;
    };
    swapDetails: {
        inputAmount: string;
        outputAmount: string;
        swapType: string;
        slippageBps: string;
    };
    transactions: {
        feeTx: string;
        swapTx: string;
    };
    message: string;
}
interface HandshakeData {
    payload: AxnetResponse;
    headers: {
        x402id: string | null;
        agentId: string | null;
    };
}

interface AxnetSwapParams {
    userPublicKey: string;
    inputMint: string;
    inputDecimals: number;
    outputMint: string;
    amount: string | number;
    slippageBps?: number;
}
declare class AxnetSDK {
    private baseUrl;
    constructor(baseUrl?: string);
    /**
     * Executes the full x402 swap flow:
     * 1. Get Payloads -> 2. Sign -> 3. Relay Signatures
     */
    swap(params: AxnetSwapParams, signAllTransactions: (txs: VersionedTransaction[]) => Promise<VersionedTransaction[]>, onHandshake?: (data: HandshakeData) => Promise<void> | void): Promise<any>;
}

export { AxnetSDK, type AxnetSwapParams };
