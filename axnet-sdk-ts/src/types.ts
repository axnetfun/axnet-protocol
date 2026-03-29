export type AxnetRequest = AxnetSwapParams | ExecuteRequest;

export interface AxnetSwapParams {
    userPublicKey: string;
    inputMint: string;
    inputDecimals: number;
    slippageBps: number;
    outputMint: string;
    amount: string;
}

export interface ExecuteRequest {
    signatures: {
        feeTx: string;
        swapTx: string;
    }
}

export interface AxnetResponse {
    id: string;
    status: string;

    // 1. The Cost to use Axnet
    paymentContext: {
        asset: string;
        amount: string;
        mint: string;
        merchantAta: string;
        platformFee: string;
    }

    // 2. The Expected Result of the Swap (New)
    swapDetails: {
        inputAmount: string;
        outputAmount: string;
        swapType: string;
        slippageBps: string;
    }

    // 3. The Payloads to Sign
    transactions: {
        feeTx: string;
        swapTx: string;
    }

    message: string;
}

export interface HandshakeData {
    payload: AxnetResponse;
    headers: {
        x402id: string | null;
        agentId: string | null;
    };
}