// Mock Redis to avoid connection issues during tests
// Individual tests can override specific methods as needed
jest.mock("../src/redis.ts", () => {
    return {
        __esModule: true,
        default: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            exists: jest.fn(),
            expire: jest.fn(),
            ttl: jest.fn(),
            ping: jest.fn().mockResolvedValue("PONG"),
            quit: jest.fn(),
            disconnect: jest.fn(),
            on: jest.fn(),
        },
    };
});
