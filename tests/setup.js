require("reflect-metadata");
const { Container } = require("typedi");

process.env.NODE_ENV = "test";

process.env.JWT_SECRET = "test-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.MAIL_HOST = "smtp.ethereal.email";
process.env.MAIL_PORT = "587";
process.env.MAIL_USER = "test@ethereal.email";
process.env.MAIL_PASSWORD = "test-password";

// Reset container before each test
beforeEach(() => {
    Container.reset();
});

// Mock console methods to avoid noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

jest.mock("../src/config/redis.ts", () => {
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
