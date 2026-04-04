// src/index.ts
import { VersionedTransaction } from "@solana/web3.js";
import { Buffer } from "buffer";
var AxnetSDK = class {
  constructor(baseUrl = "https://api.axnet.tech") {
    this.baseUrl = baseUrl;
  }
  /**
   * Executes the full x402 swap flow: 
   * 1. Get Payloads -> 2. Sign -> 3. Relay Signatures
   */
  async swap(params, signAllTransactions, onHandshake) {
    const response = await fetch(`${this.baseUrl}/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    if (!response.ok) throw new Error(`Axnet Error: ${response.statusText}`);
    const payload = await response.json();
    const { transactions } = payload;
    const x402id = response.headers.get("x-402-id");
    const agentId = response.headers.get("x-402-agent-id");
    if (onHandshake) {
      const handshakeData = {
        payload,
        headers: {
          x402id,
          agentId
        }
      };
      await onHandshake(handshakeData);
    }
    const tx1 = VersionedTransaction.deserialize(Buffer.from(transactions.feeTx, "base64"));
    const tx2 = VersionedTransaction.deserialize(Buffer.from(transactions.swapTx, "base64"));
    const signedTxs = await signAllTransactions([tx1, tx2]);
    const response2 = await fetch(`${this.baseUrl}/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-402-id": x402id ?? ""
      },
      body: JSON.stringify({
        signatures: {
          feeTx: Buffer.from(signedTxs[0].serialize()).toString("base64"),
          swapTx: Buffer.from(signedTxs[1].serialize()).toString("base64")
        }
      })
    });
    if (!response2.ok) throw new Error("Axnet Execution Failed");
    return await response2.json();
  }
};
export {
  AxnetSDK
};
