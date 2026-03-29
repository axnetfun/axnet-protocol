"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AxnetSDK: () => AxnetSDK
});
module.exports = __toCommonJS(index_exports);
var import_web3 = require("@solana/web3.js");
var import_buffer = require("buffer");
var AxnetSDK = class {
  constructor(baseUrl = "https://api.axnet.fun") {
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
    const tx1 = import_web3.VersionedTransaction.deserialize(import_buffer.Buffer.from(transactions.feeTx, "base64"));
    const tx2 = import_web3.VersionedTransaction.deserialize(import_buffer.Buffer.from(transactions.swapTx, "base64"));
    const signedTxs = await signAllTransactions([tx1, tx2]);
    const response2 = await fetch(`${this.baseUrl}/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-402-id": x402id ?? ""
      },
      body: JSON.stringify({
        signatures: {
          feeTx: import_buffer.Buffer.from(signedTxs[0].serialize()).toString("base64"),
          swapTx: import_buffer.Buffer.from(signedTxs[1].serialize()).toString("base64")
        }
      })
    });
    if (!response2.ok) throw new Error("Axnet Execution Failed");
    return await response2.json();
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AxnetSDK
});
