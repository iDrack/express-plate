import { timeStamp } from "console";
import { HealthController } from "../../../../src/modules/health/health.controller";
import { HealthService } from "../../../../src/modules/health/health.service";
import { HealthStatus } from "../../../../src/modules/health/health.types";
import type { Request, Response, NextFunction } from "express";
import { MockContainer } from "../../../utils/mockContainer";


describe("Health Controller class", () => {
    let healthController: HealthController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;
    let mockHealthService: jest.Mocked<HealthService>;

    beforeEach(() => {
        mockHealthService =
            MockContainer.createMockService<HealthService>(HealthService);

        healthController = new HealthController();
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    afterEach(() => {
        MockContainer.reset();
    });

    it("should create a health controller instance", () => {
        const controller = new HealthController();
        expect(controller).toBeInstanceOf(HealthController);
    });

    describe("ping", () => {
        it("should return status 200 with healthy status, timestamp and uptime", async () => {
            // Arrange
            const mockUptime = 12345;
            jest.spyOn(mockHealthService, "getUptime").mockReturnValue(
                mockUptime,
            );

            // Act
            await healthController.ping(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockHealthService.getUptime).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: HealthStatus.HEALTHY,
                timestamp: expect.any(String),
                uptime: mockUptime,
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("should call next with error when an exception occurs", async () => {
            // Arrange
            const mockError = new Error("Service unavailable");
            jest.spyOn(mockHealthService, "getUptime").mockImplementation(
                () => {
                    throw mockError;
                },
            );

            // Act
            await healthController.ping(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockNext).toHaveBeenCalledWith(mockError);
            expect(mockResponse.status).not.toHaveBeenCalled();
            expect(mockResponse.json).not.toHaveBeenCalled();
        });

        it("should return a valid ISO timestamp", async () => {
            // Arrange
            jest.spyOn(mockHealthService, "getUptime").mockReturnValue(100);
            const beforeTest = new Date().toISOString();

            // Act
            await healthController.ping(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
            const timestamp = jsonCall.timestamp;
            expect(timestamp).toBeTruthy();
            expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });
    });

    describe("isAlive", () => {
        it("should return status 200 with 'alive' and timestamp", async () => {
            //Arrange
            const expectedResponse = {
                status: "alive",
                timestamp: expect.any(String),
            };
            //Act
            await healthController.isAlive(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            //Assert
            expect(mockResponse.status).toHaveBeenLastCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("should return a valid ISO timestamp", async () => {
            //Arrange
            const beforeTest = new Date().toISOString();

            //Act
            await healthController.isAlive(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            //Assert
            const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
            const timestamp = jsonCall.timestamp;
            expect(timestamp).toBeTruthy();
            expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });

        it("should call next with error when an exception occurs", async () => {
            // Arrange
            const mockError = new Error("Unexpected error");
            jest.spyOn(mockResponse, "status").mockImplementation(() => {
                throw mockError;
            });

            // Act
            await healthController.isAlive(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe("isDBReady", () => {
        it("should return status 200 with 'ready' when database is healthy", async () => {
            // Arrange
            jest.spyOn(mockHealthService, "pingDB").mockResolvedValue(true);

            // Act
            await healthController.isDBReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockHealthService.pingDB).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "ready",
                timestamp: expect.any(String),
                dependencies: {
                    database: true,
                },
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("should return status 503 with 'not_ready' when database is unhealthy", async () => {
            // Arrange
            jest.spyOn(mockHealthService, "pingDB").mockResolvedValue(false);

            // Act
            await healthController.isDBReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockHealthService.pingDB).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(503);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "not_ready",
                timestamp: expect.any(String),
                dependencies: {
                    database: false,
                },
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("should return status 503 when database check throws an error", async () => {
            // Arrange
            const mockError = new Error("Database connection failed");
            jest.spyOn(mockHealthService, "pingDB").mockRejectedValue(
                mockError,
            );

            // Act
            await healthController.isDBReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockHealthService.pingDB).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(503);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "not_ready",
                timestamp: expect.any(String),
                dependencies: {
                    database: false,
                },
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("should return a valid ISO timestamp when ready", async () => {
            // Arrange
            jest.spyOn(mockHealthService, "pingDB").mockResolvedValue(true);

            // Act
            await healthController.isDBReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
            const timestamp = jsonCall.timestamp;
            expect(timestamp).toBeTruthy();
            expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });

        it("should return a valid ISO timestamp when not ready", async () => {
            // Arrange
            const mockError = new Error("Database error");
            jest.spyOn(mockHealthService, "pingDB").mockRejectedValue(
                mockError,
            );

            // Act
            await healthController.isDBReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
            const timestamp = jsonCall.timestamp;
            expect(timestamp).toBeTruthy();
            expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });
    });

    describe("isRedisReady", () => {
        it("should return status 200 with 'ready' when Redis is available", async () => {
            // Arrange
            jest.spyOn(mockHealthService, "pingRedis").mockResolvedValue(true);

            // Act
            await healthController.isRedisReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockHealthService.pingRedis).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "ready",
                timestamp: expect.any(String),
                dependencies: {
                    redis: true,
                },
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("should return status 503 with 'not_ready' when Redis is unavailable", async () => {
            // Arrange
            jest.spyOn(mockHealthService, "pingRedis").mockResolvedValue(false);

            // Act
            await healthController.isRedisReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockHealthService.pingRedis).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(503);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "not_ready",
                timestamp: expect.any(String),
                dependencies: {
                    redis: false,
                },
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("should return status 503 when Redis check throws an error", async () => {
            // Arrange
            const mockError = new Error("Redis connection failed");
            jest.spyOn(mockHealthService, "pingRedis").mockRejectedValue(
                mockError,
            );

            // Act
            await healthController.isRedisReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockHealthService.pingRedis).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(503);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "not_ready",
                timestamp: expect.any(String),
                dependencies: {
                    redis: false,
                },
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("should return a valid ISO timestamp when ready", async () => {
            // Arrange
            jest.spyOn(mockHealthService, "pingRedis").mockResolvedValue(true);

            // Act
            await healthController.isRedisReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
            const timestamp = jsonCall.timestamp;
            expect(timestamp).toBeTruthy();
            expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });

        it("should return a valid ISO timestamp when not ready", async () => {
            // Arrange
            const mockError = new Error("Redis error");
            jest.spyOn(mockHealthService, "pingRedis").mockRejectedValue(
                mockError,
            );

            // Act
            await healthController.isRedisReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
            const timestamp = jsonCall.timestamp;
            expect(timestamp).toBeTruthy();
            expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });
    });

    describe("isReady", () => {
        it("should return status 200 with 'ready' when both database and Redis are ready", async () => {
            // Arrange
            jest.spyOn(mockHealthService, "pingDB").mockResolvedValue(true);
            jest.spyOn(mockHealthService, "pingRedis").mockResolvedValue(true);

            // Act
            await healthController.isReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockHealthService.pingDB).toHaveBeenCalled();
            expect(mockHealthService.pingRedis).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "ready",
                timestamp: expect.any(String),
                dependencies: {
                    database: true,
                    redis: true,
                },
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("should return status 503 with 'not_ready' when database is not ready", async () => {
            // Arrange
            jest.spyOn(mockHealthService, "pingDB").mockResolvedValue(false);
            jest.spyOn(mockHealthService, "pingRedis").mockResolvedValue(true);

            // Act
            await healthController.isReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockHealthService.pingDB).toHaveBeenCalled();
            expect(mockHealthService.pingRedis).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(503);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "not_ready",
                timestamp: expect.any(String),
                dependencies: {
                    database: false,
                    redis: true,
                },
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("should return status 503 with 'not_ready' when Redis is not ready", async () => {
            // Arrange
            jest.spyOn(mockHealthService, "pingDB").mockResolvedValue(true);
            jest.spyOn(mockHealthService, "pingRedis").mockResolvedValue(false);

            // Act
            await healthController.isReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockHealthService.pingDB).toHaveBeenCalled();
            expect(mockHealthService.pingRedis).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "not_ready",
                timestamp: expect.any(String),
                dependencies: {
                    database: true,
                    redis: false,
                },
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("should return status 503 with 'not_ready' when both database and Redis are not ready", async () => {
            // Arrange
            jest.spyOn(mockHealthService, "pingDB").mockResolvedValue(false);
            jest.spyOn(mockHealthService, "pingRedis").mockResolvedValue(false);

            // Act
            await healthController.isReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockHealthService.pingDB).toHaveBeenCalled();
            expect(mockHealthService.pingRedis).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(503);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "not_ready",
                timestamp: expect.any(String),
                dependencies: {
                    database: false,
                    redis: false,
                },
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("should return status 503 when an error occurs during checks", async () => {
            // Arrange
            const mockError = new Error("Connection error");
            jest.spyOn(mockHealthService, "pingDB").mockRejectedValue(
                mockError,
            );
            jest.spyOn(mockHealthService, "pingRedis").mockRejectedValue(
                mockError,
            );

            // Act
            await healthController.isReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(503);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "not_ready",
                timestamp: expect.any(String),
                dependencies: {
                    database: false,
                    redis: false,
                },
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("should return a valid ISO timestamp when ready", async () => {
            // Arrange
            jest.spyOn(mockHealthService, "pingDB").mockResolvedValue(true);
            jest.spyOn(mockHealthService, "pingRedis").mockResolvedValue(true);

            // Act
            await healthController.isReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
            const timestamp = jsonCall.timestamp;
            expect(timestamp).toBeTruthy();
            expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });

        it("should return a valid ISO timestamp when not ready", async () => {
            // Arrange
            const mockError = new Error("Connection error");
            jest.spyOn(mockHealthService, "pingDB").mockRejectedValue(
                mockError,
            );
            jest.spyOn(mockHealthService, "pingRedis").mockRejectedValue(
                mockError,
            );

            // Act
            await healthController.isReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
            const timestamp = jsonCall.timestamp;
            expect(timestamp).toBeTruthy();
            expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });
    });

    describe("healthCheck", () => {
        let originalEnv: NodeJS.ProcessEnv;

        beforeEach(() => {
            originalEnv = process.env;
            process.env = { ...originalEnv };
        });

        afterEach(() => {
            process.env = originalEnv;
        });

        it("should return status 200 with all healthy checks", async () => {
            // Arrange
            const mockDbCheck = {
                status: HealthStatus.HEALTHY,
                responseTime: 50,
                message: "Connection successful.",
            };
            const mockRedisCheck = {
                status: HealthStatus.HEALTHY,
                responseTime: 5,
                message: "Connection successful.",
            };
            const mockMemoryCheck = {
                status: HealthStatus.HEALTHY,
                responseTime: 0,
                message: "100MB / 200MB (0.5%)",
            };
            const mockUptime = 12345;

            jest.spyOn(mockHealthService, "checkDatabase").mockResolvedValue(
                mockDbCheck,
            );
            jest.spyOn(mockHealthService, "checkRedis").mockResolvedValue(
                mockRedisCheck,
            );
            jest.spyOn(mockHealthService, "checkMemory").mockReturnValue(
                mockMemoryCheck,
            );
            jest.spyOn(mockHealthService, "checkGlobalStatus").mockReturnValue(
                HealthStatus.HEALTHY,
            );
            jest.spyOn(mockHealthService, "getUptime").mockReturnValue(
                mockUptime,
            );

            process.env.NODE_ENV = "production";

            // Act
            await healthController.healthCheck(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockHealthService.checkDatabase).toHaveBeenCalled();
            expect(mockHealthService.checkRedis).toHaveBeenCalled();
            expect(mockHealthService.checkMemory).toHaveBeenCalled();
            expect(mockHealthService.checkGlobalStatus).toHaveBeenCalledWith({
                database: mockDbCheck,
                redis: mockRedisCheck,
                memory: mockMemoryCheck,
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: HealthStatus.HEALTHY,
                timestamp: expect.any(String),
                uptime: mockUptime,
                checks: {
                    database: mockDbCheck,
                    redis: mockRedisCheck,
                    memory: mockMemoryCheck,
                },
                version: expect.any(String),
                environment: "production",
            });
        });

        it("should return status 503 when overall status is unhealthy", async () => {
            // Arrange
            const mockDbCheck = {
                status: HealthStatus.UNHEALTHY,
                responseTime: 5000,
                message: "Connection failed.",
            };
            const mockRedisCheck = {
                status: HealthStatus.HEALTHY,
                responseTime: 5,
                message: "Connection successful.",
            };
            const mockMemoryCheck = {
                status: HealthStatus.HEALTHY,
                responseTime: 0,
                message: "100MB / 200MB (0.5%)",
            };
            const mockUptime = 12345;

            jest.spyOn(mockHealthService, "checkDatabase").mockResolvedValue(
                mockDbCheck,
            );
            jest.spyOn(mockHealthService, "checkRedis").mockResolvedValue(
                mockRedisCheck,
            );
            jest.spyOn(mockHealthService, "checkMemory").mockReturnValue(
                mockMemoryCheck,
            );
            jest.spyOn(mockHealthService, "checkGlobalStatus").mockReturnValue(
                HealthStatus.UNHEALTHY,
            );
            jest.spyOn(mockHealthService, "getUptime").mockReturnValue(
                mockUptime,
            );

            // Act
            await healthController.healthCheck(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(503);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: HealthStatus.UNHEALTHY,
                timestamp: expect.any(String),
                uptime: mockUptime,
                checks: {
                    database: mockDbCheck,
                    redis: mockRedisCheck,
                    memory: mockMemoryCheck,
                },
                version: expect.any(String),
                environment: "test",
            });
        });

        it("should return status 200 when overall status is degraded", async () => {
            // Arrange
            const mockDbCheck = {
                status: HealthStatus.DEGRADED,
                responseTime: 1500,
                message: "Slow response time.",
            };
            const mockRedisCheck = {
                status: HealthStatus.HEALTHY,
                responseTime: 5,
                message: "Connection successful.",
            };
            const mockMemoryCheck = {
                status: HealthStatus.HEALTHY,
                responseTime: 0,
                message: "100MB / 200MB (0.5%)",
            };
            const mockUptime = 12345;

            jest.spyOn(mockHealthService, "checkDatabase").mockResolvedValue(
                mockDbCheck,
            );
            jest.spyOn(mockHealthService, "checkRedis").mockResolvedValue(
                mockRedisCheck,
            );
            jest.spyOn(mockHealthService, "checkMemory").mockReturnValue(
                mockMemoryCheck,
            );
            jest.spyOn(mockHealthService, "checkGlobalStatus").mockReturnValue(
                HealthStatus.DEGRADED,
            );
            jest.spyOn(mockHealthService, "getUptime").mockReturnValue(
                mockUptime,
            );

            // Act
            await healthController.healthCheck(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: HealthStatus.DEGRADED,
                timestamp: expect.any(String),
                uptime: mockUptime,
                checks: {
                    database: mockDbCheck,
                    redis: mockRedisCheck,
                    memory: mockMemoryCheck,
                },
                version: expect.any(String),
                environment: "test",
            });
        });

        it("should return status 503 when an exception occurs", async () => {
            // Arrange
            const mockError = new Error("Unexpected error");
            jest.spyOn(mockHealthService, "checkDatabase").mockRejectedValue(
                mockError,
            );

            // Act
            await healthController.healthCheck(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(503);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: HealthStatus.UNHEALTHY,
                timestamp: expect.any(String),
                checks: {},
                version: expect.any(String),
                environment: "test",
            });
        });

        it("should return a valid ISO timestamp", async () => {
            // Arrange
            const mockDbCheck = {
                status: HealthStatus.HEALTHY,
                responseTime: 50,
                message: "Connection successful.",
            };
            const mockMemoryCheck = {
                status: HealthStatus.HEALTHY,
                responseTime: 0,
                message: "100MB / 200MB (0.5%)",
            };

            jest.spyOn(mockHealthService, "checkDatabase").mockResolvedValue(
                mockDbCheck,
            );
            jest.spyOn(mockHealthService, "checkMemory").mockReturnValue(
                mockMemoryCheck,
            );
            jest.spyOn(mockHealthService, "checkGlobalStatus").mockReturnValue(
                HealthStatus.HEALTHY,
            );
            jest.spyOn(mockHealthService, "getUptime").mockReturnValue(12345);

            // Act
            await healthController.healthCheck(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
            const timestamp = jsonCall.timestamp;
            expect(timestamp).toBeTruthy();
            expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });

        it("should call both database and memory checks in parallel", async () => {
            // Arrange
            const mockDbCheck = {
                status: HealthStatus.HEALTHY,
                responseTime: 50,
                message: "Connection successful.",
            };
            const mockMemoryCheck = {
                status: HealthStatus.HEALTHY,
                responseTime: 0,
                message: "100MB / 200MB (0.5%)",
            };

            const dbSpy = jest
                .spyOn(mockHealthService, "checkDatabase")
                .mockResolvedValue(mockDbCheck);
            const memorySpy = jest
                .spyOn(mockHealthService, "checkMemory")
                .mockReturnValue(mockMemoryCheck);
            jest.spyOn(mockHealthService, "checkGlobalStatus").mockReturnValue(
                HealthStatus.HEALTHY,
            );
            jest.spyOn(mockHealthService, "getUptime").mockReturnValue(12345);

            // Act
            await healthController.healthCheck(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(dbSpy).toHaveBeenCalled();
            expect(memorySpy).toHaveBeenCalled();
        });
    });
});
