import { timeStamp } from "console";
import { HealthController } from "../../../../src/modules/health/health.controller";
import { healthService } from "../../../../src/modules/health/health.service";
import { HealthStatus } from "../../../../src/modules/health/health.types";
import type { Request, Response, NextFunction } from "express";

describe("Health Controller class", () => {
    let healthController: HealthController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        healthController = new HealthController();
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should create a health controller instance", () => {
        const controller = new HealthController();
        expect(controller).toBeInstanceOf(HealthController);
    });

    describe("ping", () => {
        it("should return status 200 with healthy status, timestamp and uptime", async () => {
            // Arrange
            const mockUptime = 12345;
            jest.spyOn(healthService, "getUptime").mockReturnValue(mockUptime);

            // Act
            await healthController.ping(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(healthService.getUptime).toHaveBeenCalled();
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
            jest.spyOn(healthService, "getUptime").mockImplementation(() => {
                throw mockError;
            });

            // Act
            await healthController.ping(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalledWith(mockError);
            expect(mockResponse.status).not.toHaveBeenCalled();
            expect(mockResponse.json).not.toHaveBeenCalled();
        });

        it("should return a valid ISO timestamp", async () => {
            // Arrange
            jest.spyOn(healthService, "getUptime").mockReturnValue(100);
            const beforeTest = new Date().toISOString();

            // Act
            await healthController.ping(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
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
                mockNext
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
                mockNext
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
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe("isReady", () => {
        it("should return status 200 with 'ready' when database is healthy", async () => {
            // Arrange
            const mockDbCheck = {
                status: HealthStatus.HEALTHY,
                responseTime: 50,
                message: "Connection successful.",
            };
            jest.spyOn(healthService, "checkDatabase").mockResolvedValue(
                mockDbCheck
            );

            // Act
            await healthController.isReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(healthService.checkDatabase).toHaveBeenCalled();
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
            const mockDbCheck = {
                status: HealthStatus.UNHEALTHY,
                responseTime: 150,
                message: "Connection failed.",
            };
            jest.spyOn(healthService, "checkDatabase").mockResolvedValue(
                mockDbCheck
            );

            // Act
            await healthController.isReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(healthService.checkDatabase).toHaveBeenCalled();
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

        it("should return status 503 with 'not_ready' when database is degraded", async () => {
            // Arrange
            const mockDbCheck = {
                status: HealthStatus.DEGRADED,
                responseTime: 1200,
                message: "Slow response time.",
            };
            jest.spyOn(healthService, "checkDatabase").mockResolvedValue(
                mockDbCheck
            );

            // Act
            await healthController.isReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(healthService.checkDatabase).toHaveBeenCalled();
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
            jest.spyOn(healthService, "checkDatabase").mockRejectedValue(
                mockError
            );

            // Act
            await healthController.isReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(healthService.checkDatabase).toHaveBeenCalled();
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
            const mockDbCheck = {
                status: HealthStatus.HEALTHY,
                responseTime: 50,
                message: "Connection successful.",
            };
            jest.spyOn(healthService, "checkDatabase").mockResolvedValue(
                mockDbCheck
            );

            // Act
            await healthController.isReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
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
            jest.spyOn(healthService, "checkDatabase").mockRejectedValue(
                mockError
            );

            // Act
            await healthController.isReady(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
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
            const mockMemoryCheck = {
                status: HealthStatus.HEALTHY,
                responseTime: 0,
                message: "100MB / 200MB (0.5%)",
            };
            const mockUptime = 12345;

            jest.spyOn(healthService, "checkDatabase").mockResolvedValue(
                mockDbCheck
            );
            jest.spyOn(healthService, "checkMemory").mockReturnValue(
                mockMemoryCheck
            );
            jest.spyOn(healthService, "checkGlobalStatus").mockReturnValue(
                HealthStatus.HEALTHY
            );
            jest.spyOn(healthService, "getUptime").mockReturnValue(mockUptime);

            process.env.NODE_ENV = "production";

            // Act
            await healthController.healthCheck(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(healthService.checkDatabase).toHaveBeenCalled();
            expect(healthService.checkMemory).toHaveBeenCalled();
            expect(healthService.checkGlobalStatus).toHaveBeenCalledWith({
                database: mockDbCheck,
                memory: mockMemoryCheck,
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: HealthStatus.HEALTHY,
                timestamp: expect.any(String),
                uptime: mockUptime,
                checks: {
                    database: mockDbCheck,
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
            const mockMemoryCheck = {
                status: HealthStatus.HEALTHY,
                responseTime: 0,
                message: "100MB / 200MB (0.5%)",
            };
            const mockUptime = 12345;

            jest.spyOn(healthService, "checkDatabase").mockResolvedValue(
                mockDbCheck
            );
            jest.spyOn(healthService, "checkMemory").mockReturnValue(
                mockMemoryCheck
            );
            jest.spyOn(healthService, "checkGlobalStatus").mockReturnValue(
                HealthStatus.UNHEALTHY
            );
            jest.spyOn(healthService, "getUptime").mockReturnValue(mockUptime);

            // Act
            await healthController.healthCheck(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(503);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: HealthStatus.UNHEALTHY,
                timestamp: expect.any(String),
                uptime: mockUptime,
                checks: {
                    database: mockDbCheck,
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
            const mockMemoryCheck = {
                status: HealthStatus.HEALTHY,
                responseTime: 0,
                message: "100MB / 200MB (0.5%)",
            };
            const mockUptime = 12345;

            jest.spyOn(healthService, "checkDatabase").mockResolvedValue(
                mockDbCheck
            );
            jest.spyOn(healthService, "checkMemory").mockReturnValue(
                mockMemoryCheck
            );
            jest.spyOn(healthService, "checkGlobalStatus").mockReturnValue(
                HealthStatus.DEGRADED
            );
            jest.spyOn(healthService, "getUptime").mockReturnValue(mockUptime);

            // Act
            await healthController.healthCheck(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: HealthStatus.DEGRADED,
                timestamp: expect.any(String),
                uptime: mockUptime,
                checks: {
                    database: mockDbCheck,
                    memory: mockMemoryCheck,
                },
                version: expect.any(String),
                environment: "test",
            });
        });

        it("should return status 503 when an exception occurs", async () => {
            // Arrange
            const mockError = new Error("Unexpected error");
            jest.spyOn(healthService, "checkDatabase").mockRejectedValue(
                mockError
            );

            // Act
            await healthController.healthCheck(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
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

            jest.spyOn(healthService, "checkDatabase").mockResolvedValue(
                mockDbCheck
            );
            jest.spyOn(healthService, "checkMemory").mockReturnValue(
                mockMemoryCheck
            );
            jest.spyOn(healthService, "checkGlobalStatus").mockReturnValue(
                HealthStatus.HEALTHY
            );
            jest.spyOn(healthService, "getUptime").mockReturnValue(12345);

            // Act
            await healthController.healthCheck(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
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
                .spyOn(healthService, "checkDatabase")
                .mockResolvedValue(mockDbCheck);
            const memorySpy = jest
                .spyOn(healthService, "checkMemory")
                .mockReturnValue(mockMemoryCheck);
            jest.spyOn(healthService, "checkGlobalStatus").mockReturnValue(
                HealthStatus.HEALTHY
            );
            jest.spyOn(healthService, "getUptime").mockReturnValue(12345);

            // Act
            await healthController.healthCheck(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(dbSpy).toHaveBeenCalled();
            expect(memorySpy).toHaveBeenCalled();
        });
    });
});
