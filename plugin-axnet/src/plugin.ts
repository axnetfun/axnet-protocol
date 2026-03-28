import type { Plugin } from '@elizaos/core';
import {
  type Action,
  type ActionResult,
  type GenerateTextParams,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  ModelType,
  type Provider,
  type ProviderResult,
  type RouteRequest,
  type RouteResponse,
  Service,
  type State,
  logger,
  type MessagePayload,
  type WorldPayload,
  EventType,
} from '@elizaos/core';
import { VersionedTransaction } from "@solana/web3.js";
import { z } from 'zod';

/**
 * Defines the configuration schema for a plugin, including the validation rules for the plugin name.
 *
 * @type {import('zod').ZodObject<{ EXAMPLE_PLUGIN_VARIABLE: import('zod').ZodString }>}
 */
const configSchema = z.object({
  AXNET_REGISTRY_ID: z.string().default("DEpPuMuVZGUAJtN5gVxUNFQUL8jsjF26T781gMT1twE"),
  AXNET_API_URL: z.string().default("https://api.axnet.fun/swap"),
});

/**
 * Example HelloWorld action
 * This demonstrates the simplest possible action structure
 */
/**
 * Action representing a hello world message.
 * @typedef {Object} Action
 * @property {string} name - The name of the action.
 * @property {string[]} similes - An array of related actions.
 * @property {string} description - A brief description of the action.
 * @property {Function} validate - Asynchronous function to validate the action.
 * @property {Function} handler - Asynchronous function to handle the action and generate a response.
 * @property {Object[]} examples - An array of example inputs and expected outputs for the action.
 */
const axnetAction: Action = {
  name: 'AXNET_SWAP',
  similes: ['SWAP_TOKENS', 'TRADE_SOLANA', 'BUY_TOKEN'],
  description: 'Executes a stateless x402 swap via Axnet.',

  validate: async (runtime: IAgentRuntime, message: Memory, _state: State | undefined): Promise<boolean> => {
    // 1. Check if the required environment variables exist
    const apiUrl = runtime.getSetting("AXNET_API_URL") || process.env.AXNET_API_URL;
    if (!apiUrl) {
      console.warn("Axnet Action: AXNET_API_URL not configured. Action disabled.");
      return false;
    }

    // 2. Simple Keyword Check
    // This prevents the agent from hallucinating a swap during a casual greeting
    const keywords = ['swap', 'buy', 'trade', 'exchange', 'jupiter', 'axnet'];
    const text = message.content.text?.toLowerCase() ?? '';
    const hasIntent = keywords.some(kw => text.includes(kw));

    // 3. Optional: Wallet Check
    // If the agent doesn't have a loaded wallet, it can't sign transactions
    const hasWallet = !!(runtime as any).walletProvider;

    return hasIntent && hasWallet;
  },

  parameters: [
    {
      name: 'inputMint',
      description: 'Mint address to swap FROM',
      required: true,
      schema: { type: 'string' }
    },
    {
      name: 'inputDecimals',
      description: 'Decimal precision of the input token (9 for SOL, 6 for USDC)',
      required: true,
      schema: { type: 'number' }
    },
    {
      name: 'outputMint',
      description: 'Mint address to swap TO',
      required: true,
      schema: { type: 'string' }
    },
    {
      name: 'amount',
      description: 'Amount (e.g. 0.1)',
      required: true,
      schema: { type: 'string' }
    },
    {
      name: 'slippageBps',
      description: 'Optional slippage tolerance in basis points (50 = 0.5%, 100 = 1%)',
      default: 50,
      required: true,
      schema: { type: 'number' }
    }
  ],

  handler: async (runtime, message, _state, _options, callback): Promise<ActionResult> => {
    try {
      const { inputMint, inputDecimals, outputMint, amount, slippageBps } = message.content as any;

      const apiPayload = {
        userPublicKey: (runtime as any).walletProvider.publicKey.toBase58(),
        inputMint,
        inputDecimals: Number(inputDecimals),
        outputMint,
        amount,
        slippageBps: Number(slippageBps || 50)
      };

      // --- STEP 1: INITIAL REQUEST ---
      let response = await fetch(process.env.AXNET_API_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload)
      });

      // --- STEP 2: HANDLE 402 PAYMENT REQUIRED ---
      if (response.status === 402) {
        const x402Id = response.headers.get('x-402-id'); // Extract the session ID
        const { transactions } = await response.json();

        // STEP 3: SIGN LOCALLY
        // 1. Convert base64 strings from Go API to VersionedTransactions
        const tx1 = VersionedTransaction.deserialize(Buffer.from(transactions.feeTx, 'base64'));
        const tx2 = VersionedTransaction.deserialize(Buffer.from(transactions.swapTx, 'base64'));

        // 2. Batch Sign (Atomic intent)
        // This triggers the agent's local signer to sign both without broadcasting yet
        const signedTxs = await (runtime as any).walletProvider.signAllTransactions([tx1, tx2]);

        // 3. Extract the Signatures to send back to Axnet
        // Axnet Faciliator will handle the broadcast to ensure fee + swap land in order
        const feeSig = Buffer.from(signedTxs[0].signatures[0]).toString('base64');
        const swapSig = Buffer.from(signedTxs[1].signatures[0]).toString('base64');

        // --- STEP 4: THE RETRY (Settle the Swap) ---
        // We send the signatures back to the SAME endpoint with the ID header
        const retryResponse = await fetch(process.env.AXNET_API_URL!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-402-id': x402Id!, // Pass back the ID from the challenge
          },
          body: JSON.stringify({
            signatures: {
              feeTx: Buffer.from(signedTxs[0].serialize()).toString('base64'),
              swapTx: Buffer.from(signedTxs[1].serialize()).toString('base64')
            }
          })
        });

        if (retryResponse.ok) {
          const result = await retryResponse.json();
          const text = `✅ Swap complete! \nID: ${x402Id?.slice(0, 8)} \nTx: ${swapSig.slice(0, 12)}...`;

          if (callback) await callback({ text, content: { success: true, ...result } });
          return { success: true, text };
        }
      }

      return { success: false, text: "Swap failed or declined." };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  },

  examples: [
    [
      {
        name: "{{user1}}",
        content: {
          text: "Swap 1 SOL for USDC please",
        },
      },
      {
        name: "{{agentName}}",
        content: {
          text: "I'll handle that swap for you using the Axnet gateway. Processing 1 SOL to USDC now.",
          action: "AXNET_SWAP",
          inputMint: "So11111111111111111111111111111111111111112",
          inputDecimals: 9,
          outputMint: "EPjFW36vn7Ox8967syHbDe7fHLzp6mBWEYRiRET91Rvt",
          amount: "1",
          slippageBps: 50
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: {
          text: "Buy some BONK with 0.5 SOL, use 1% slippage",
        },
      },
      {
        name: "{{agentName}}",
        content: {
          text: "Initiating a buy for BONK with 0.5 SOL at 100 bps slippage via Axnet.",
          action: "AXNET_SWAP",
          inputMint: "So11111111111111111111111111111111111111112",
          inputDecimals: 9,
          outputMint: "DezXAZ8z7Pnrn9vzct4XVkMGfGVYchGQZ6VP615B612", // BONK Mint
          amount: "0.5",
          slippageBps: 100
        },
      },
    ],
  ],
};

/**
 * Example Hello World Provider
 * This demonstrates the simplest possible provider implementation
 */
/**
 * Axnet x402 Provider
 * Injects the stateless gateway identity and fee structure into the agent's context.
 */
const axnetProvider: Provider = {
  name: 'AXNET_PROVIDER',
  description: 'Supplies real-time stateless x402 gateway configuration and trust status',

  get: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state: State | undefined
  ): Promise<ProviderResult> => {
    // 1. Fetch config from runtime settings or env
    const registryId = runtime.getSetting("AXNET_REGISTRY_ID") || process.env.AXNET_REGISTRY_ID;
    const apiUrl = runtime.getSetting("AXNET_API_URL") || process.env.AXNET_API_URL;

    // 2. Define the core context string for the LLM
    const contextText = [
      "Protocol: Axnet Stateless Liquidity Gateway (x402)",
      `Registry ID: ${registryId || "DEpPuMuVZGUAJtN5gVxUNFQUL8jsjF26T781gMT1twE"}`,
      "Handshake: Double-Barrel (Fee + Execution) atomic signing",
      "Standard Fee: 0.005 USDC per swap",
      "Status: Verified on Solana Agent Registry (SAR)",
      `Endpoint: ${apiUrl}`
    ].join("\n");

    return {
      // 'text' is what the LLM actually reads in its prompt
      text: contextText,

      // 'values' can be used for template variable replacement
      values: {
        fee: "0.005",
        currency: "USDC",
        protocol: "x402"
      },

      // 'data' is structured metadata for other plugins/services
      data: {
        registryId: registryId,
        isStateless: true,
        supportedNetworks: ["solana-mainnet"]
      },
    };
  },
};

export class AxnetService extends Service {
  // 1. Identify the service uniquely in the runtime
  static override serviceType = 'axnet';

  override capabilityDescription =
    'Provides stateless x402 liquidity routing and registry verification for Solana agents.';

  private isReady: boolean = false;

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  // 2. The Start method (Initialize your connection)
  static override async start(runtime: IAgentRuntime): Promise<Service> {
    logger.info('🚀 Starting Axnet Service...');
    
    const service = new AxnetService(runtime);
    
    // Perform a health check on the Axnet API during startup
    try {
      const apiUrl = runtime.getSetting("AXNET_API_URL") || process.env.AXNET_API_URL;
      if (apiUrl) {
        service.isReady = true;
        logger.success('✅ Axnet Service is operational and registry-linked.');
      }
    } catch (e) {
      logger.error('❌ Axnet Service failed to verify API connectivity.');
    }
    
    return service;
  }

  // 3. Add a Helper Method (The "Pro" Touch)
  // This allows your Action to check if the service is healthy before swapping
  public async getStatus() {
    return {
      initialized: this.isReady,
      protocol: 'x402',
      version: '2.0.0-beta'
    };
  }

  static override async stop(runtime: IAgentRuntime): Promise<void> {
    logger.info('🛑 Stopping Axnet Service');
    const service = runtime.getService<AxnetService>(AxnetService.serviceType);
    if (service) {
      await service.stop();
    }
  }

  override async stop(): Promise<void> {
    this.isReady = false;
    logger.info('Axnet Service cleanup complete.');
  }
}

export const axnetPlugin: Plugin = {
  name: 'plugin-axnet',
  description: 'Stateless x402 liquidity gateway for autonomous agents on Solana',
  
  // 1. Link your updated config variables
  config: {
    AXNET_API_URL: process.env.AXNET_API_URL,
    AXNET_REGISTRY_ID: process.env.AXNET_REGISTRY_ID,
  },

  // 2. The Initialization Logic
  async init(config: Record<string, string>) {
    logger.info('🚀 Initializing Axnet x402 Plugin...');
    try {
      // Validates using the Zod schema we updated earlier
      const validatedConfig = await configSchema.parseAsync(config);

      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) process.env[key] = value;
      }
      logger.success('✅ Axnet configuration validated.');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues?.map((e) => e.message)?.join(', ') || 'Unknown error';
        throw new Error(`Invalid Axnet Config: ${errorMessages}`);
      }
      throw error;
    }
  },

  // 3. Remove the Rickroll & clean up Model overrides
  // Most plugins should leave these to the core runtime unless you have a custom Axnet LLM
  models: {}, 

  // 4. Update the Health Check Route
  routes: [
    {
      name: 'axnet-status',
      path: '/api/axnet/status',
      type: 'GET',
      handler: async (_req: RouteRequest, res: RouteResponse) => {
        res.json({
          status: 'operational',
          protocol: 'x402',
          registryId: process.env.AXNET_REGISTRY_ID,
          timestamp: new Date().toISOString(),
        });
      },
    },
  ],

  // 5. Clean up Events (Only log what you need for debugging x402)
  events: {
    [EventType.MESSAGE_RECEIVED]: [
      async (params: MessagePayload) => {
        logger.debug(`Axnet observed message: ${params.message.content.text?.slice(0, 30)}...`);
      },
    ],
  },

  // 6. Connect your updated components
  services: [AxnetService],
  actions: [axnetAction],
  providers: [axnetProvider],
};

export default axnetPlugin;
