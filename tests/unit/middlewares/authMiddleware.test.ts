import { Request, Response, NextFunction } from "express";
import {
    authenticate,
    authorize,
} from "../../../src/middlewares/authMiddleware";
import { AppError } from "../../../src/middlewares/errorHandler";
import { JwtService } from "../../../src/modules/core/jwt.service";
import { userService } from "../../../src/modules/user/user.service";

jest.mock("../../../src/modules/core/jwt.service");
jest.mock("../../../src/modules/user/user.service");

describe("Authentification middleware", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        const user = {
            id: 1,
            name: "test",
            role: "user",
        };
        mockRequest = {
            user: user,
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("authenticate", () => {
        it("should authenticate user with valid token and add user to request", async () => {
            //Arrange
            const mockDecoded = {
                id: 1,
                name: "test",
                role: "user",
            };
            mockRequest = {
                headers: {
                    authorization: "Bearer validtoken123",
                },
            };
            (JwtService.verifyAccessToken as jest.Mock).mockReturnValue(
                mockDecoded
            );
            (userService.checkUserExist as jest.Mock).mockResolvedValue(true);

            //Act
            await authenticate(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            //Assert
            expect(JwtService.verifyAccessToken).toHaveBeenCalledWith(
                "validtoken123"
            );
            expect(userService.checkUserExist).toHaveBeenCalledWith(1);
            expect(mockRequest.user).toEqual(mockDecoded);
            expect(mockNext).toHaveBeenCalledWith();
        });

        it("should throw 401 error when no authorization header", async () => {
            //Arrange
            mockRequest = {
                headers: {},
            };

            //Act
            await authenticate(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            //Assert
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(401);
            expect(error.message).toBe("You need to be logged in.");
        });

        it("should throw 401 error when authorization header doesn't start with Bearer", async () => {
            //Arrange
            mockRequest = {
                headers: {
                    authorization: "Basic token123",
                },
            };

            //Act
            await authenticate(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            //Assert
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(401);
            expect(error.message).toBe("You need to be logged in.");
        });

        it("should throw 401 error when token is invalid", async () => {
            //Arrange
            mockRequest = {
                headers: {
                    authorization: "Bearer invalidtoken",
                },
            };
            (JwtService.verifyAccessToken as jest.Mock).mockImplementation(
                () => {
                    throw new AppError("Invalid token", 401);
                }
            );

            //Act
            await authenticate(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            //Assert
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(401);
        });

        it("should throw 401 error when user no longer exists", async () => {
            //Arrange
            const mockDecoded = {
                id: 999,
                name: "deleted",
                role: "user",
            };
            mockRequest = {
                headers: {
                    authorization: "Bearer validtoken123",
                },
            };
            (JwtService.verifyAccessToken as jest.Mock).mockReturnValue(
                mockDecoded
            );
            (userService.checkUserExist as jest.Mock).mockResolvedValue(false);

            //Act
            await authenticate(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            //Assert
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(401);
            expect(error.message).toBe("User no longer exists.");
        });
    });

    describe("authorize", () => {
        it("should let a user with the correct role go thought", () => {
            //Arrange
            const roles = ["user"];
            //Act
            const middleware = authorize(roles);

            //Assert
            middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );
            expect(mockNext).toHaveBeenCalled();
        });

        it("should throw a 401 error when user isn't logged in", () => {
            //Arrange
            mockRequest.user = undefined;
            const roles = ["user"];
            const middleware = authorize(roles);

            //Act
            middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            //Assert
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(401);
            expect(error.message).toBe(
                "You need to be logged in to access this ressource."
            );
        });

        it("should throw a 403 error when user doesn't has correct role", () => {
            //Arrange
            const roles = ["admin"];
            const middleware = authorize(roles);

            //Act
            middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            //Assert
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(403);
            expect(error.message).toBe(
                "Forbidden: Insuffisant rights to access this ressource."
            );
        });
    });
});
