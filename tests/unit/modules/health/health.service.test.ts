import { healthService } from "../../../../src/modules/health/health.service";
import { AppDataSource } from "../../../../src/config/database";
import { HealthStatus } from "../../../../src/modules/health/health.types";

jest.mock("../../../../src/config/database", () => ({
    AppDataSource: {
        query: jest.fn(),
        isInitialized: true,
    },
}));

describe("Health service class", () => {
    let startTime = Date.now();

    beforeEach(() => {
        jest.clearAllMocks();
        (AppDataSource as any).isInitialized = true;
    });

    describe("getUptime", () => {
        it("should return system uptime", () => {
            // Arrange
            const expectedUptime = Math.floor((Date.now() - startTime) / 1000);
            // Act
            const uptime = healthService.getUptime();
            // Assert
            expect(uptime).toBe(expectedUptime);
        });
    });

    describe("checkDatabase", () => {
        it("should return HEALTHY status with fast response time", async () => {
            // Arrange
            (AppDataSource.query as jest.Mock).mockResolvedValue([
                { result: 1 },
            ]);
            (AppDataSource as any).isInitialized = true;

            // Act
            const result = await healthService.checkDatabase();

            // Assert
            expect(AppDataSource.query).toHaveBeenCalledWith("SELECT 1");
            expect(result.status).toBe(HealthStatus.HEALTHY);
            expect(result.responseTime).toBeLessThan(1000);
            expect(result.message).toBe("Connection successful.");
        });

        it("should return UNHEALTHY status when database is not initialized", async () => {
            // Arrange
            (AppDataSource.query as jest.Mock).mockResolvedValue([
                { result: 1 },
            ]);
            (AppDataSource as any).isInitialized = false;

            // Act
            const result = await healthService.checkDatabase();

            // Assert
            expect(result.status).toBe(HealthStatus.UNHEALTHY);
            expect(result.message).toBe("Database is not initialized.");
            expect(result.responseTime).toBeGreaterThanOrEqual(0);
        });

        it("should return DEGRADED status when response time is slow", async () => {
            // Arrange
            (AppDataSource as any).isInitialized = true;
            (AppDataSource.query as jest.Mock).mockImplementation(() => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve([{ result: 1 }]), 1100);
                });
            });

            // Act
            const result = await healthService.checkDatabase();

            // Assert
            expect(result.status).toBe(HealthStatus.DEGRADED);
            expect(result.responseTime).toBeGreaterThan(1000);
            expect(result.message).toBe("Slow response time.");
        });

        it("should return UNHEALTHY status when query throws an error", async () => {
            // Arrange
            const mockError = new Error("Connection refused");
            (AppDataSource.query as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await healthService.checkDatabase();

            // Assert
            expect(result.status).toBe(HealthStatus.UNHEALTHY);
            expect(result.message).toBe("Connection refused");
            expect(result.responseTime).toBeGreaterThanOrEqual(0);
        });

        it("should return UNHEALTHY with 'Error unknown.' when error is not an Error instance", async () => {
            // Arrange
            (AppDataSource.query as jest.Mock).mockRejectedValue(
                "String error"
            );

            // Act
            const result = await healthService.checkDatabase();

            // Assert
            expect(result.status).toBe(HealthStatus.UNHEALTHY);
            expect(result.message).toBe("Error unknown.");
            expect(result.responseTime).toBeGreaterThanOrEqual(0);
        });

        it("should measure response time accurately", async () => {
            // Arrange
            (AppDataSource as any).isInitialized = true;
            const delayMs = 100;
            (AppDataSource.query as jest.Mock).mockImplementation(() => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve([{ result: 1 }]), delayMs);
                });
            });

            // Act
            const result = await healthService.checkDatabase();

            // Assert
            expect(result.responseTime).toBeGreaterThanOrEqual(delayMs);
            expect(result.responseTime).toBeLessThan(delayMs + 50); // Tolérance de 50ms
            expect(result.status).toBe(HealthStatus.HEALTHY);
        });
    });

    describe("checkMemory", () => {
        let originalMemoryUsage: typeof process.memoryUsage;

        beforeEach(() => {
            originalMemoryUsage = process.memoryUsage;
        });

        afterEach(() => {
            process.memoryUsage = originalMemoryUsage;
        });

        it("should return HEALTHY status with low memory usage", () => {
            // Arrange - 50% (100MB sur 200MB)
            process.memoryUsage = jest.fn().mockReturnValue({
                heapUsed: 100 * 1024 * 1024, // 100MB
                heapTotal: 200 * 1024 * 1024, // 200MB
                rss: 150 * 1024 * 1024,
                external: 0,
                arrayBuffers: 0,
            }) as any;

            // Act
            const result = healthService.checkMemory();

            // Assert
            expect(result.status).toBe(HealthStatus.HEALTHY);
            expect(result.responseTime).toBe(0);
            expect(result.message).toContain("100MB / 200MB");
            expect(result.message).not.toContain("High memory usage");
            expect(result.message).not.toContain("Critical memory usage");
        });

        it("should return HEALTHY status at 80% threshold", () => {
            // Arrange - 80%
            process.memoryUsage = jest.fn().mockReturnValue({
                heapUsed: 160 * 1024 * 1024, // 160MB
                heapTotal: 200 * 1024 * 1024, // 200MB
                rss: 200 * 1024 * 1024,
                external: 0,
                arrayBuffers: 0,
            }) as any;

            // Act
            const result = healthService.checkMemory();

            // Assert
            expect(result.status).toBe(HealthStatus.HEALTHY);
            expect(result.message).toContain("160MB / 200MB");
        });

        it("should return DEGRADED status with high memory usage (>80% and <=90%)", () => {
            // Arrange - 85%
            process.memoryUsage = jest.fn().mockReturnValue({
                heapUsed: 170 * 1024 * 1024, // 170MB
                heapTotal: 200 * 1024 * 1024, // 200MB
                rss: 200 * 1024 * 1024,
                external: 0,
                arrayBuffers: 0,
            }) as any;

            // Act
            const result = healthService.checkMemory();

            // Assert
            expect(result.status).toBe(HealthStatus.DEGRADED);
            expect(result.responseTime).toBe(0);
            expect(result.message).toContain("170MB / 200MB");
            expect(result.message).toContain("High memory usage");
        });

        it("should return DEGRADED status at 90% threshold", () => {
            // Arrange - 90%
            process.memoryUsage = jest.fn().mockReturnValue({
                heapUsed: 180 * 1024 * 1024, // 180MB
                heapTotal: 200 * 1024 * 1024, // 200MB
                rss: 200 * 1024 * 1024,
                external: 0,
                arrayBuffers: 0,
            }) as any;

            // Act
            const result = healthService.checkMemory();

            // Assert
            expect(result.status).toBe(HealthStatus.DEGRADED);
            expect(result.message).toContain("High memory usage");
        });

        it("should return UNHEALTHY status with critical memory usage (>90%)", () => {
            // Arrange - 95%
            process.memoryUsage = jest.fn().mockReturnValue({
                heapUsed: 190 * 1024 * 1024, // 190MB
                heapTotal: 200 * 1024 * 1024, // 200MB
                rss: 200 * 1024 * 1024,
                external: 0,
                arrayBuffers: 0,
            }) as any;

            // Act
            const result = healthService.checkMemory();

            // Assert
            expect(result.status).toBe(HealthStatus.UNHEALTHY);
            expect(result.responseTime).toBe(0);
            expect(result.message).toContain("190MB / 200MB");
            expect(result.message).toContain("Critical memory usage");
        });

        it("should return UNHEALTHY status at 100% memory usage", () => {
            // Arrange - 100%
            process.memoryUsage = jest.fn().mockReturnValue({
                heapUsed: 200 * 1024 * 1024, // 200MB
                heapTotal: 200 * 1024 * 1024, // 200MB
                rss: 200 * 1024 * 1024,
                external: 0,
                arrayBuffers: 0,
            }) as any;

            // Act
            const result = healthService.checkMemory();

            // Assert
            expect(result.status).toBe(HealthStatus.UNHEALTHY);
            expect(result.message).toContain("200MB / 200MB");
            expect(result.message).toContain("Critical memory usage");
        });

        it("should format message correctly with percentage", () => {
            // Arrange
            process.memoryUsage = jest.fn().mockReturnValue({
                heapUsed: 123 * 1024 * 1024, // 123MB
                heapTotal: 456 * 1024 * 1024, // 456MB
                rss: 200 * 1024 * 1024,
                external: 0,
                arrayBuffers: 0,
            }) as any;

            // Act
            const result = healthService.checkMemory();

            // Assert
            expect(result.message).toMatch(/123MB \/ 456MB \(\d+\.\d%\)/);
            expect(result.status).toBe(HealthStatus.HEALTHY);
        });

        it("should round memory values to MB", () => {
            // Arrange
            process.memoryUsage = jest.fn().mockReturnValue({
                heapUsed: 100.7 * 1024 * 1024, // ~100.7MB
                heapTotal: 200.3 * 1024 * 1024, // ~200.3MB
                rss: 200 * 1024 * 1024,
                external: 0,
                arrayBuffers: 0,
            }) as any;

            // Act
            const result = healthService.checkMemory();

            // Assert
            expect(result.message).toContain("101MB / 200MB");
        });
    });

    describe("checkGlobalStatus", () => {
        it("should return HEALTHY when all checks are healthy", () => {
            // Arrange
            const checks = {
                database: {
                    status: HealthStatus.HEALTHY,
                    responseTime: 50,
                    message: "Connection successful.",
                },
                memory: {
                    status: HealthStatus.HEALTHY,
                    responseTime: 0,
                    message: "100MB / 200MB (50.0%)",
                },
            };

            // Act
            const result = healthService.checkGlobalStatus(checks);

            // Assert
            expect(result).toBe(HealthStatus.HEALTHY);
        });

        it("should return DEGRADED when at least one check is degraded", () => {
            // Arrange
            const checks = {
                database: {
                    status: HealthStatus.HEALTHY,
                    responseTime: 50,
                    message: "Connection successful.",
                },
                memory: {
                    status: HealthStatus.DEGRADED,
                    responseTime: 0,
                    message: "180MB / 200MB (90.0%) - High memory usage",
                },
            };

            // Act
            const result = healthService.checkGlobalStatus(checks);

            // Assert
            expect(result).toBe(HealthStatus.DEGRADED);
        });

        it("should return UNHEALTHY when at least one check is unhealthy", () => {
            // Arrange
            const checks = {
                database: {
                    status: HealthStatus.UNHEALTHY,
                    responseTime: 5000,
                    message: "Connection failed.",
                },
                memory: {
                    status: HealthStatus.HEALTHY,
                    responseTime: 0,
                    message: "100MB / 200MB (50.0%)",
                },
            };

            // Act
            const result = healthService.checkGlobalStatus(checks);

            // Assert
            expect(result).toBe(HealthStatus.UNHEALTHY);
        });

        it("should return UNHEALTHY when both unhealthy and degraded checks exist", () => {
            // Arrange
            const checks = {
                database: {
                    status: HealthStatus.UNHEALTHY,
                    responseTime: 5000,
                    message: "Connection failed.",
                },
                memory: {
                    status: HealthStatus.DEGRADED,
                    responseTime: 0,
                    message: "180MB / 200MB (90.0%) - High memory usage",
                },
            };

            // Act
            const result = healthService.checkGlobalStatus(checks);

            // Assert
            expect(result).toBe(HealthStatus.UNHEALTHY);
        });

        it("should return HEALTHY with empty checks object", () => {
            // Arrange
            const checks = {};

            // Act
            const result = healthService.checkGlobalStatus(checks);

            // Assert
            expect(result).toBe(HealthStatus.HEALTHY);
        });

        it("should return DEGRADED with multiple degraded checks", () => {
            // Arrange
            const checks = {
                database: {
                    status: HealthStatus.DEGRADED,
                    responseTime: 1500,
                    message: "Slow response time.",
                },
                memory: {
                    status: HealthStatus.DEGRADED,
                    responseTime: 0,
                    message: "180MB / 200MB (90.0%) - High memory usage",
                },
                redis: {
                    status: HealthStatus.HEALTHY,
                    responseTime: 10,
                    message: "Redis OK",
                },
            };

            // Act
            const result = healthService.checkGlobalStatus(checks);

            // Assert
            expect(result).toBe(HealthStatus.DEGRADED);
        });

        it("should return UNHEALTHY with multiple unhealthy checks", () => {
            // Arrange
            const checks = {
                database: {
                    status: HealthStatus.UNHEALTHY,
                    responseTime: 5000,
                    message: "Connection failed.",
                },
                redis: {
                    status: HealthStatus.UNHEALTHY,
                    responseTime: 5000,
                    message: "Redis connection failed.",
                },
                memory: {
                    status: HealthStatus.HEALTHY,
                    responseTime: 0,
                    message: "100MB / 200MB (50.0%)",
                },
            };

            // Act
            const result = healthService.checkGlobalStatus(checks);

            // Assert
            expect(result).toBe(HealthStatus.UNHEALTHY);
        });

        it("should handle single check correctly", () => {
            // Arrange
            const checks = {
                database: {
                    status: HealthStatus.DEGRADED,
                    responseTime: 1200,
                    message: "Slow response time.",
                },
            };

            // Act
            const result = healthService.checkGlobalStatus(checks);

            // Assert
            expect(result).toBe(HealthStatus.DEGRADED);
        });
    });
});
