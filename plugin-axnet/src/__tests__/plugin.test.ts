import { describe, expect, it, spyOn, beforeEach, beforeAll, mock } from 'bun:test';
import { axnetPlugin, AxnetService } from '../index';
import {
  type IAgentRuntime,
  type Action,
  logger,
  EventType,
} from '@elizaos/core';
import {
  createMockRuntime,
  createTestMemory,
  createTestState,
  testFixtures,
} from './test-utils';
import { VersionedTransaction } from '@solana/web3.js';

// Setup environment variables (Mocks don't strictly need them, but good practice)
process.env.AXNET_API_URL = 'https://api.axnet.fun/swap';
process.env.AXNET_REGISTRY_ID = 'DEpPuMuVZGUAJtN5gVxUNFQUL8jsjF26T781gMT1twE';

beforeAll(() => {
  // Silence logs during tests to keep output clean
  spyOn(logger, 'info').mockImplementation(() => { });
  spyOn(logger, 'error').mockImplementation(() => { });
  spyOn(logger, 'debug').mockImplementation(() => { });
  spyOn(logger, 'success').mockImplementation(() => { });

  spyOn(VersionedTransaction, 'deserialize').mockImplementation(() => {
    return {
      signatures: [new Uint8Array(64)],
      // ADD THIS: The handler needs to call serialize() before sending back to Axnet
      serialize: () => new Uint8Array([1, 2, 3, 4]),
      message: {
        serialize: () => new Uint8Array(0),
        staticAccountKeys: [],
        compiledInstructions: []
      }
    } as any;
  });
});

describe('Axnet Plugin: Core Metadata', () => {
  it('should export a valid ElizaOS plugin structure', () => {


    expect(axnetPlugin.name).toBe('plugin-axnet');
    expect(axnetPlugin.services).toContain(AxnetService);
    expect(axnetPlugin.actions?.map(a => a.name)).toContain('AXNET_SWAP');
  });
});

describe('Axnet Action: AXNET_SWAP (x402 Handshake)', () => {
  let runtime: IAgentRuntime;
  let swapAction: Action;

  beforeEach(() => {
    runtime = createMockRuntime();
    swapAction = axnetPlugin.actions?.find(a => a.name === 'AXNET_SWAP') as Action;
  });

  it('should successfully execute the x402 "Double-Barrel" flow', async () => {
    // 1. CLEAR ANY EXISTING FETCH MOCKS
    // @ts-ignore
    global.fetch = undefined;

    // 2. DEFINE THE STRICT MOCK
    // This replaces the global fetch entirely for this test
    global.fetch = mock(async (url, init) => {
      const headers = init?.headers as Record<string, string>;

      // LEG 2: If the x-402-id header is present, this is the RETRY/SETTLEMENT
      if (headers && headers['x-402-id'] === 'test-session-xyz-123') {
        return new Response(JSON.stringify({
          success: true,
          txHash: '5K8p...fakeSig'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // LEG 1: Initial request (The Challenge)
      return new Response(JSON.stringify({
        transactions: {
          feeTx: Buffer.from("mock-fee-payload").toString('base64'),
          swapTx: Buffer.from("mock-swap-payload").toString('base64')
        }
      }), {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
          'x-402-id': 'test-session-xyz-123'
        }
      });
    });

    const message = createTestMemory({
      content: {
        text: 'Swap 1 SOL for USDC',
        inputMint: 'So11111111111111111111111111111111111111112',
        inputDecimals: 9,
        outputMint: 'EPjFW36vn7Ox8967syHbDe7fHLzp6mBWEYRiRET91Rvt',
        amount: '1',
        slippageBps: 50
      },
    });

    // 3. EXECUTE
    const result = await swapAction.handler(runtime, message, undefined, undefined, async () => []);

    // 4. ASSERTIONS
    expect(result?.success).toBe(true);

    // Check that our strict mock was called exactly twice
    // @ts-ignore
    expect(global.fetch).toHaveBeenCalledTimes(2);

    // CLEANUP: Reset fetch to original state if necessary for other tests
    // @ts-ignore
    global.fetch = mock(() => { throw new Error("Fetch not mocked!"); });
  });

  it('should return failure if the backend rejects the signatures (403/400)', async () => {
    // Mock a failure on the second leg of the handshake
    const mockFetch = spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        status: 402,
        headers: new Map([['x-402-id', 'bad-session']]),
        json: async () => ({ payment_tx: '...', execution_tx: '...' })
      } as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden - Invalid Signatures'
      } as any);

    const message = createTestMemory({ content: { text: 'swap 1 SOL' } });
    const result = await swapAction.handler(runtime, message, undefined, undefined, async () => []);

    expect(result?.success).toBe(false);
    mockFetch.mockRestore();
  });
});

describe('Axnet Provider: Context Injection', () => {
  it('should provide the Registry ID to the agent prompt', async () => {
    const runtime = createMockRuntime();
    const provider = axnetPlugin.providers?.find(p => p.name === 'AXNET_PROVIDER');

    const result = await provider!.get(runtime, createTestMemory(), createTestState());

    expect(result.text).toContain('DEpPuMuVZGUAJtN5gVxUNFQUL8jsjF26T781gMT1twE');
    expect(result.text).toContain('x402');
  });
});

describe('Axnet Service: Initialization', () => {
  it('should register as an "axnet" service type', async () => {
    const runtime = createMockRuntime();
    const service = await AxnetService.start(runtime);

    expect(AxnetService.serviceType).toBe('axnet');
    expect(service).toBeInstanceOf(AxnetService);
  });
});

describe('Axnet Health Route: API Endpoint', () => {
  it('should expose a functional status check route', async () => {
    const runtime = createMockRuntime();
    const route = axnetPlugin.routes?.find(r => r.name === 'axnet-status');

    const mockRes = {
      json: (data: any) => { mockRes._jsonData = data; },
      _jsonData: null as any,
    };

    await route!.handler({}, mockRes as any, runtime);

    expect(mockRes._jsonData.status).toBe('operational');
    expect(mockRes._jsonData.protocol).toBe('x402');
  });
});
