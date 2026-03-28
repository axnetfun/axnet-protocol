import { mock, spyOn } from 'bun:test';
import {
  type IAgentRuntime,
  type Memory,
  type State,
  type Content,
  type UUID,
  type Character,
  type Service,
  type ServiceTypeName,
  ModelType,
  asUUID,
  logger,
} from '@elizaos/core';

/**
 * Creates a UUID for testing
 */
export function createUUID(): UUID {
  return asUUID(crypto.randomUUID());
}

/**
 * Creates a test character
 */
export function createTestCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: createUUID(),
    name: 'Axnet Test Bot',
    username: 'axnet_bot',
    modelProvider: 'openai',
    bio: 'A test character for Axnet x402 swaps',
    system: 'You are a helpful assistant for testing.',
    plugins: [],
    settings: {},
    messageExamples: [],
    postExamples: [],
    topics: [],
    adjectives: [],
    style: { all: [], chat: [], post: [] },
    ...overrides,
  };
}

/**
 * Creates a test memory
 */
export function createTestMemory(overrides: Partial<Memory> = {}): Memory {
  const now = Date.now();
  return {
    id: createUUID(),
    agentId: createUUID(),
    userId: createUUID(),
    roomId: createUUID(),
    content: {
      text: 'Test message',
      source: 'test',
      ...overrides.content, // Merges custom content fields like inputMint
    },
    createdAt: now,
    ...overrides,
  };
}

/**
 * Creates a test state
 */
export function createTestState(overrides: Partial<State> = {}): State {
  return {
    agentId: createUUID(),
    roomId: createUUID(),
    userId: createUUID(),
    bio: 'Test bio',
    lore: 'Test lore',
    userName: 'Test User',
    userBio: 'Test user bio',
    actors: '',
    recentMessages: '',
    recentInteractions: '',
    goals: 'Test goals',
    image: '',
    messageDirections: '',
    values: {},
    data: {},
    text: '',
    ...overrides,
  };
}

/**
 * Creates a properly typed mock runtime
 */
export function createMockRuntime(overrides: Partial<IAgentRuntime> = {}): IAgentRuntime {
  const agentId = overrides.agentId || createUUID();
  const character = overrides.character || createTestCharacter();

  const mockRuntime = {
    agentId,
    character,
    initPromise: Promise.resolve(),
    services: new Map<ServiceTypeName, Service>(),
    events: new Map(),
    routes: [],

    // Core Settings
    getSetting: mock((key: string) => {
      if (key === 'AXNET_API_URL') return 'https://api.axnet.fun/swap';
      if (key === 'AXNET_REGISTRY_ID') return 'DEpPuMuVZGUAJtN5gVxUNFQUL8jsjF26T781gMT1twE';
      return null;
    }),

    // Wallet Provider (Crucial for x402 handler)
    walletProvider: {
      publicKey: {
        toBase58: () => "TestPublicKey11111111111111111111111111111",
      },
      signAllTransactions: mock(async (txs: any[]) => {
        return txs.map(tx => {
          tx.signatures = [Buffer.from("fake-sig")];
          return tx;
        });
      }),
    },

    // Managers
    messageManager: {
      createMemory: mock().mockResolvedValue(undefined),
      getMemories: mock().mockResolvedValue([]),
    },

    // Services
    getService: mock((type: string) => null),
    registerService: mock(),

    // Utility
    composeState: mock().mockResolvedValue(createTestState()),
    processActions: mock().mockResolvedValue(undefined),

    // Logger
    logger: {
      info: mock(),
      warn: mock(),
      error: mock(),
      debug: mock(),
      success: mock(),
    },

    ...overrides,
  } as unknown as IAgentRuntime;

  return mockRuntime;
}

/**
 * Creates test fixtures for event payloads
 */
export const testFixtures = {
  messagePayload: (overrides: any = {}) => ({
    message: createTestMemory(overrides.message),
    runtime: {} as IAgentRuntime,
    ...overrides,
  }),
};
