import { Request, Response, NextFunction } from "express";
import { AppError, errorHandler } from "../../../src/middlewares/errorHandler"
import { logger } from "../../../src/config/logger";

describe("Error handler middleware", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
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

    it("should return a custom HTTP response when using an AppError", () => {
        //Arrange
        const errorTest = new AppError("test message",400)
        jest.spyOn(logger,"error")

        //Act
        errorHandler(errorTest, mockRequest as Request, mockResponse as Response, mockNext);
        //Assert
        expect(logger.error).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
            statusCode: 400,
            status: "Bad Request",
            message: "test message"
        });
    });

        it("should return a error 500 when using a standard Error", () => {
        //Arrange
        const errorTest = new Error("test message")
        jest.spyOn(logger,"error")

        //Act
        errorHandler(errorTest, mockRequest as Request, mockResponse as Response, mockNext);
        //Assert
        expect(logger.error).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            statusCode: 500,
            status: "Internal Server Error",
            message: "test message"
        });
    });

    it("should hide error details in production", () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "production";
        
        const errorTest = new Error("test message");
        errorHandler(errorTest, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.json).toHaveBeenCalledWith({
            statusCode: 500,
            status: "Internal Server Error",
            message: "Internal Server Error"
        });
        
        process.env.NODE_ENV = originalEnv; 
    });
})