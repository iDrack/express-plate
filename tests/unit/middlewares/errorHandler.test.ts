import { Request, Response, NextFunction } from "express";
import { AppError, errorHandler } from "../../../src/middlewares/errorHandler";
import { logger } from "../../../src/config/logger";

// Mock logger
jest.mock("../../../src/config/logger", () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
    },
}));

describe("Error handler middleware", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;
    let originalEnv: string | undefined;

    beforeEach(() => {
        originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "test";

        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
        jest.clearAllMocks();
    });

    describe("AppError handling", () => {
        it("should return a custom HTTP response when using an AppError", () => {
            // Arrange
            const errorTest = new AppError("test message", 400);

            // Act
            errorHandler(
                errorTest,
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(logger.error).toHaveBeenCalledWith(
                "user id: anonymous - test message",
            );
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: 400,
                status: "Bad Request",
                message: "test message",
            });
        });

        it("should log user id when user is authenticated", () => {
            // Arrange
            const errorTest = new AppError("test message", 401);
            mockRequest.user = { id: 123, name: "testUser", role: "user" };

            // Act
            errorHandler(
                errorTest,
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(logger.error).toHaveBeenCalledWith(
                "user id: 123 - test message",
            );
        });

        it("should handle AppError with 404 status", () => {
            // Arrange
            const errorTest = new AppError("Resource not found", 404);

            // Act
            errorHandler(
                errorTest,
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: 404,
                status: "Not Found",
                message: "Resource not found",
            });
        });

        it("should handle AppError with 500 status", () => {
            // Arrange
            const errorTest = new AppError("Server error", 500);

            // Act
            errorHandler(
                errorTest,
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: 500,
                status: "Internal Server Error",
                message: "Server error",
            });
        });

        it("should handle AppError with 403 Forbidden status", () => {
            // Arrange
            const errorTest = new AppError("Access denied", 403);

            // Act
            errorHandler(
                errorTest,
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: 403,
                status: "Forbidden",
                message: "Access denied",
            });
        });

        it("should handle AppError with 409 Conflict status", () => {
            // Arrange
            const errorTest = new AppError("Resource already exists", 409);

            // Act
            errorHandler(
                errorTest,
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: 409,
                status: "Conflict",
                message: "Resource already exists",
            });
        });

        it("should use status code as string when STATUS_CODES doesn't have it", () => {
            // Arrange
            const errorTest = new AppError("Custom error", 999);

            // Act
            errorHandler(
                errorTest,
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(999);
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: 999,
                status: "999",
                message: "Custom error",
            });
        });
    });

    describe("Standard Error handling", () => {
        it("should return a error 500 when using a standard Error", () => {
            // Arrange
            const errorTest = new Error("test message");

            // Act
            errorHandler(
                errorTest,
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(logger.error).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: 500,
                status: "Internal Server Error",
                message: "test message",
            });
        });

        it("should log error stack when available", () => {
            // Arrange
            const errorTest = new Error("test message");
            const errorStack = errorTest.stack;

            // Act
            errorHandler(
                errorTest,
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(logger.error).toHaveBeenCalledWith(errorStack);
        });

        it("should log error object when stack is not available", () => {
            // Arrange
            const errorTest = new Error("test message");
            errorTest.stack = undefined;

            // Act
            errorHandler(
                errorTest,
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(logger.error).toHaveBeenCalledWith(errorTest);
        });

        it("should show error message in development environment", () => {
            // Arrange
            process.env.NODE_ENV = "development";
            const errorTest = new Error("detailed error message");

            // Act
            errorHandler(
                errorTest,
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: 500,
                status: "Internal Server Error",
                message: "detailed error message",
            });
        });

        it("should show error message in test environment", () => {
            // Arrange
            process.env.NODE_ENV = "test";
            const errorTest = new Error("test error details");

            // Act
            errorHandler(
                errorTest,
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: 500,
                status: "Internal Server Error",
                message: "test error details",
            });
        });

        it("should hide error details in production", () => {
            // Arrange
            process.env.NODE_ENV = "production";
            const errorTest = new Error("sensitive error message");

            // Act
            errorHandler(
                errorTest,
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: 500,
                status: "Internal Server Error",
                message: "Internal Server Error",
            });
        });

        it("should hide error details when NODE_ENV is undefined", () => {
            // Arrange
            process.env.NODE_ENV = undefined;
            const errorTest = new Error("test error");

            // Act
            errorHandler(
                errorTest,
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            // Assert
            expect(mockResponse.json).toHaveBeenCalledWith({
                statusCode: 500,
                status: "Internal Server Error",
                message: "Internal Server Error",
            });
        });
    });

    describe("AppError class", () => {
        it("should create an AppError with correct properties", () => {
            // Arrange & Act
            const error = new AppError("Test error", 400);

            // Assert
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe("Test error");
            expect(error.statusCode).toBe(400);
            expect(error.status).toBe("Bad Request");
        });

        it("should handle unknown status codes", () => {
            // Arrange & Act
            const error = new AppError("Unknown status", 999);

            // Assert
            expect(error.statusCode).toBe(999);
            expect(error.status).toBe("999");
        });

        it("should set status from STATUS_CODES for common HTTP codes", () => {
            // Arrange & Act
            const error200 = new AppError("OK", 200);
            const error401 = new AppError("Unauthorized", 401);
            const error404 = new AppError("Not Found", 404);
            const error500 = new AppError("Server Error", 500);

            // Assert
            expect(error200.status).toBe("OK");
            expect(error401.status).toBe("Unauthorized");
            expect(error404.status).toBe("Not Found");
            expect(error500.status).toBe("Internal Server Error");
        });
    });
});
