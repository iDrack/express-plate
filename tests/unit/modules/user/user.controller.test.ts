import { Request, Response, NextFunction } from "express";
import { UserController } from "../../../../src/modules/user/user.controller";
import { AuthRequest } from "../../../../src/middlewares/authMiddleware";
import { Role } from "../../../../src/models/role";
import { userService } from "../../../../src/modules/user/user.service";
import { AppError } from "../../../../src/middlewares/errorHandler";
import { JwtService } from "../../../../src/modules/core/jwt.service";

// Mock userService
jest.mock("../../../../src/modules/user/user.service", () => ({
    userService: {
        login: jest.fn(),
        getUserByEmail: jest.fn(),
        getUserByName: jest.fn(),
        createUser: jest.fn(),
        testCredentials: jest.fn(),
        getUserById: jest.fn(),
        getAllUsers: jest.fn(),
        updateUser: jest.fn(),
        deleteUser: jest.fn(),
        deleteUserById: jest.fn(),
    },
}));

// Mock JwtService
jest.mock("../../../../src/modules/core/jwt.service", () => ({
    JwtService: {
        verifyRefreshToken: jest.fn(),
        generateAccessToken: jest.fn(),
    },
}));

describe("User Controller class", () => {
    let userController: UserController;
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;
    let mockUserReq: { id: number; name: string; role: string };
    let testUser: any;

    beforeEach(() => {
        userController = new UserController();
        mockUserReq = {
            id: 1,
            name: "testUser",
            role: "user",
        };

        testUser = {
            id: 1,
            name: "testUser",
            email: "test@test.com",
            role: Role.USER,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-02"),
            get createdAtLocal() {
                return this.createdAt.toLocaleString("fr-FR");
            },
        };

        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("prepareTokens", () => {
        it("should set refresh token cookie and return access token in response", async () => {
            // Arrange
            const mockAccessToken = "mock-access-token";
            const mockRefreshToken = "mock-refresh-token";

            (userService.login as jest.Mock).mockReturnValue({
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
            });

            // Act
            await userController.prepareTokens(
                mockResponse as Response,
                200,
                testUser
            );

            // Assert
            expect(userService.login).toHaveBeenCalledWith(testUser);
            expect(mockResponse.cookie).toHaveBeenCalledWith(
                "refreshToken",
                mockRefreshToken,
                {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "strict",
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                    path: "/users/refresh",
                }
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "success",
                data: {
                    user: {
                        id: testUser.id,
                        name: testUser.name,
                        role: testUser.role,
                    },
                    accessToken: mockAccessToken,
                },
            });
        });

        it("should set status 201 when creating a new user", async () => {
            // Arrange
            const mockAccessToken = "mock-access-token";
            const mockRefreshToken = "mock-refresh-token";

            (userService.login as jest.Mock).mockReturnValue({
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
            });

            // Act
            await userController.prepareTokens(
                mockResponse as Response,
                201,
                testUser
            );

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });

        it("should include user id, name and role in response", async () => {
            // Arrange
            (userService.login as jest.Mock).mockReturnValue({
                accessToken: "token1",
                refreshToken: "token2",
            });

            // Act
            await userController.prepareTokens(
                mockResponse as Response,
                200,
                testUser
            );

            // Assert
            const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
            expect(jsonCall.data.user).toEqual({
                id: testUser.id,
                name: testUser.name,
                role: testUser.role,
            });
        });
    });

    describe("createUser", () => {
        it("should create a new user successfully and call prepareTokens with status 201", async () => {
            // Arrange
            const mockAccessToken = "mock-access-token";
            const mockRefreshToken = "mock-refresh-token";

            mockRequest.body = {
                name: "newUser",
                email: "new@test.com",
                password: "Password123!",
            };

            (userService.getUserByEmail as jest.Mock).mockResolvedValue(null);
            (userService.getUserByName as jest.Mock).mockResolvedValue(null);
            (userService.createUser as jest.Mock).mockResolvedValue(testUser);
            (userService.login as jest.Mock).mockReturnValue({
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
            });

            // Act
            await userController.createUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.getUserByEmail).toHaveBeenCalledWith(
                "new@test.com"
            );
            expect(userService.getUserByName).toHaveBeenCalledWith("newUser");
            expect(userService.createUser).toHaveBeenCalledWith(
                "newUser",
                "new@test.com",
                "Password123!"
            );
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "success",
                data: {
                    user: {
                        id: testUser.id,
                        name: testUser.name,
                        role: testUser.role,
                    },
                    accessToken: mockAccessToken,
                },
            });
        });

        it("should throw error when name is missing", async () => {
            // Arrange
            mockRequest.body = {
                email: "new@test.com",
                password: "Password123!",
            };

            // Act
            await userController.createUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe(
                "You need a name, an e-mail and a password to create a user account."
            );
            expect(error.statusCode).toBe(400);
        });

        it("should throw error when email is missing", async () => {
            // Arrange
            mockRequest.body = {
                name: "newUser",
                password: "Password123!",
            };

            // Act
            await userController.createUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe(
                "You need a name, an e-mail and a password to create a user account."
            );
            expect(error.statusCode).toBe(400);
        });

        it("should throw error when password is missing", async () => {
            // Arrange
            mockRequest.body = {
                name: "newUser",
                email: "new@test.com",
            };

            // Act
            await userController.createUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe(
                "You need a name, an e-mail and a password to create a user account."
            );
            expect(error.statusCode).toBe(400);
        });

        it("should throw error when email is already in use", async () => {
            // Arrange
            mockRequest.body = {
                name: "newUser",
                email: "existing@test.com",
                password: "Password123!",
            };

            const existingUser = {
                id: 2,
                email: "existing@test.com",
            };

            (userService.getUserByEmail as jest.Mock).mockResolvedValue(
                existingUser
            );

            // Act
            await userController.createUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe(
                "E-mail :existing@test.com is already in use, please try a different one."
            );
            expect(error.statusCode).toBe(409);
        });

        it("should throw error when username is already in use", async () => {
            // Arrange
            mockRequest.body = {
                name: "existingUser",
                email: "new@test.com",
                password: "Password123!",
            };

            const existingUser = {
                id: 2,
                name: "existingUser",
            };

            (userService.getUserByEmail as jest.Mock).mockResolvedValue(null);
            (userService.getUserByName as jest.Mock).mockResolvedValue(
                existingUser
            );

            // Act
            await userController.createUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe(
                "Username :new@test.com is already in use, please try a different one."
            );
            expect(error.statusCode).toBe(409);
        });

        it("should handle 404 errors from getUserByEmail gracefully", async () => {
            // Arrange
            mockRequest.body = {
                name: "newUser",
                email: "new@test.com",
                password: "Password123!",
            };

            const notFoundError = new AppError("User not found", 404);
            (userService.getUserByEmail as jest.Mock).mockRejectedValue(
                notFoundError
            );
            (userService.getUserByName as jest.Mock).mockResolvedValue(null);
            (userService.createUser as jest.Mock).mockResolvedValue(testUser);
            (userService.login as jest.Mock).mockReturnValue({
                accessToken: "token",
                refreshToken: "refresh",
            });

            // Act
            await userController.createUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.createUser).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });

        it("should handle 404 errors from getUserByName gracefully", async () => {
            // Arrange
            mockRequest.body = {
                name: "newUser",
                email: "new@test.com",
                password: "Password123!",
            };

            const notFoundError = new AppError("User not found", 404);
            (userService.getUserByEmail as jest.Mock).mockResolvedValue(null);
            (userService.getUserByName as jest.Mock).mockRejectedValue(
                notFoundError
            );
            (userService.createUser as jest.Mock).mockResolvedValue(testUser);
            (userService.login as jest.Mock).mockReturnValue({
                accessToken: "token",
                refreshToken: "refresh",
            });

            // Act
            await userController.createUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.createUser).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });

        it("should propagate non-404 errors from getUserByEmail", async () => {
            // Arrange
            mockRequest.body = {
                name: "newUser",
                email: "new@test.com",
                password: "Password123!",
            };

            const serverError = new AppError("Database error", 500);
            (userService.getUserByEmail as jest.Mock).mockRejectedValue(
                serverError
            );

            // Act
            await userController.createUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalledWith(serverError);
            expect(userService.createUser).not.toHaveBeenCalled();
        });

        it("should propagate non-404 errors from getUserByName", async () => {
            // Arrange
            mockRequest.body = {
                name: "newUser",
                email: "new@test.com",
                password: "Password123!",
            };

            const serverError = new AppError("Database error", 500);
            (userService.getUserByEmail as jest.Mock).mockResolvedValue(null);
            (userService.getUserByName as jest.Mock).mockRejectedValue(
                serverError
            );

            // Act
            await userController.createUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalledWith(serverError);
            expect(userService.createUser).not.toHaveBeenCalled();
        });
    });

    describe("loginUser", () => {
        it("should return JWT tokens when credentials are correct", async () => {
            // Arrange
            const mockAccessToken = "mock-access-token";
            const mockRefreshToken = "mock-refresh-token";

            mockRequest.body = {
                name: "testUser",
                email: "test@test.com",
                password: "Password123!",
            };

            (userService.testCredentials as jest.Mock).mockReturnValue(
                testUser
            );
            (userService.login as jest.Mock).mockReturnValue({
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
            });
            //Act
            await userController.loginUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            //Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "success",
                data: {
                    user: {
                        id: testUser.id,
                        name: testUser.name,
                        role: testUser.role,
                    },
                    accessToken: mockAccessToken,
                },
            });
        });

        it("should return JWT tokens when email is missing but other credentials are correct", async () => {
            // Arrange
            const mockAccessToken = "mock-access-token";
            const mockRefreshToken = "mock-refresh-token";

            mockRequest.body = {
                name: "testUser",
                password: "Password123!",
            };

            (userService.testCredentials as jest.Mock).mockReturnValue(
                testUser
            );
            (userService.login as jest.Mock).mockReturnValue({
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
            });
            //Act
            await userController.loginUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            //Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "success",
                data: {
                    user: {
                        id: testUser.id,
                        name: testUser.name,
                        role: testUser.role,
                    },
                    accessToken: mockAccessToken,
                },
            });
        });

        it("should return JWT tokens when username is missing but other credentials are correct", async () => {
            // Arrange
            const mockAccessToken = "mock-access-token";
            const mockRefreshToken = "mock-refresh-token";

            mockRequest.body = {
                email: "test@test.fr",
                password: "Password123!",
            };

            (userService.testCredentials as jest.Mock).mockReturnValue(
                testUser
            );
            (userService.login as jest.Mock).mockReturnValue({
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
            });
            //Act
            await userController.loginUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            //Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "success",
                data: {
                    user: {
                        id: testUser.id,
                        name: testUser.name,
                        role: testUser.role,
                    },
                    accessToken: mockAccessToken,
                },
            });
        });

        it("should throw a 404 AppError when password is missing", async () => {
            //Arrange
            mockRequest.body = {
                name: "testUser",
                email: "test@test.com",
            };

            const testError = new AppError("Invalid credentials.", 404);

            //Act
            await userController.loginUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            //Assert
            expect(mockNext).toHaveBeenCalledWith(testError);
        });

        it("should throw a 404 AppError when username and email are missing", async () => {
            //Arrange
            mockRequest.body = {
                password: "Pass<ord123!",
            };

            const testError = new AppError("Invalid credentials.", 404);

            //Act
            await userController.loginUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            //Assert
            expect(mockNext).toHaveBeenCalledWith(testError);
        });
    });

    describe("logoutUser", () => {
        it("should remove refreshToken from cookies and return success message", async () => {
            //Act
            await userController.logoutUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            //Assert
            expect(mockResponse.clearCookie).toHaveBeenCalledWith(
                "refreshToken",
                {
                    path: "/users/refresh",
                }
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "success",
                message: "Logout successful.",
            });
        });

        it("should call next when an error occurs", async () => {
            //Arrange
            const testError = new Error("Unknown error.");
            (mockResponse.clearCookie as jest.Mock).mockImplementation(() => {
                throw testError;
            });

            //Act
            await userController.logoutUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );
            //Assert
            expect(mockNext).toHaveBeenCalledWith(testError);
        });
    });

    describe("refreshToken", () => {
        it("should return a new access token when refresh token is valid", async () => {
            // Arrange
            const mockRefreshToken = "valid-refresh-token";
            const mockNewAccessToken = "new-access-token";
            const mockDecodedToken = {
                id: 1,
                name: "testUser",
                role: "user",
            };

            mockRequest.cookies = {
                refreshToken: mockRefreshToken,
            };

            (JwtService.verifyRefreshToken as jest.Mock).mockReturnValue(
                mockDecodedToken
            );
            (JwtService.generateAccessToken as jest.Mock).mockReturnValue(
                mockNewAccessToken
            );

            // Act
            await userController.refreshToken(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(JwtService.verifyRefreshToken).toHaveBeenCalledWith(
                mockRefreshToken
            );
            expect(JwtService.generateAccessToken).toHaveBeenCalledWith({
                id: mockDecodedToken.id,
                name: mockDecodedToken.name,
                role: mockDecodedToken.role,
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "success",
                data: {
                    accessToken: mockNewAccessToken,
                },
            });
        });

        it("should throw error when refresh token is missing", async () => {
            // Arrange
            mockRequest.cookies = {};

            // Act
            await userController.refreshToken(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe("Missing refresh token.");
            expect(error.statusCode).toBe(400);
            expect(JwtService.verifyRefreshToken).not.toHaveBeenCalled();
        });

        it("should throw error when refresh token is invalid", async () => {
            // Arrange
            const mockRefreshToken = "invalid-refresh-token";
            const testError = new Error("Invalid token");

            mockRequest.cookies = {
                refreshToken: mockRefreshToken,
            };

            (JwtService.verifyRefreshToken as jest.Mock).mockImplementation(
                () => {
                    throw testError;
                }
            );

            // Act
            await userController.refreshToken(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(JwtService.verifyRefreshToken).toHaveBeenCalledWith(
                mockRefreshToken
            );
            expect(mockNext).toHaveBeenCalledWith(testError);
            expect(JwtService.generateAccessToken).not.toHaveBeenCalled();
        });

        it("should call next with error when token verification fails", async () => {
            // Arrange
            const mockRefreshToken = "expired-refresh-token";
            const jwtError = new AppError("Token expired", 401);

            mockRequest.cookies = {
                refreshToken: mockRefreshToken,
            };

            (JwtService.verifyRefreshToken as jest.Mock).mockImplementation(
                () => {
                    throw jwtError;
                }
            );

            // Act
            await userController.refreshToken(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalledWith(jwtError);
            expect(mockResponse.status).not.toHaveBeenCalled();
            expect(mockResponse.json).not.toHaveBeenCalled();
        });
    });

    describe("getProfile", () => {
        it("should return user profile when user is authenticated", async () => {
            // Arrange
            mockRequest.user = {
                id: 1,
                name: "testUser",
                role: "user",
            };

            (userService.getUserById as jest.Mock).mockResolvedValue(testUser);

            // Act
            await userController.getProfile(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.getUserById).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "success",
                data: {
                    id: testUser.id,
                    name: testUser.name,
                    email: testUser.email,
                    role: testUser.role,
                },
            });
        });

        it("should throw error when user is not authenticated (no user.id)", async () => {
            // Arrange
            mockRequest.user = {} as any;

            // Act
            await userController.getProfile(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe(
                "You need to be logged in to access your profile."
            );
            expect(error.statusCode).toBe(401);
            expect(userService.getUserById).not.toHaveBeenCalled();
        });

        it("should throw error when user is not found in database", async () => {
            // Arrange
            mockRequest.user = {
                id: 999,
                name: "testUser",
                role: "user",
            };

            (userService.getUserById as jest.Mock).mockResolvedValue(null);

            // Act
            await userController.getProfile(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.getUserById).toHaveBeenCalledWith(999);
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe("User not found.");
            expect(error.statusCode).toBe(404);
        });

        it("should handle errors from userService.getUserById", async () => {
            // Arrange
            const dbError = new Error("Database error");
            mockRequest.user = {
                id: 1,
                name: "testUser",
                role: "user",
            };

            (userService.getUserById as jest.Mock).mockRejectedValue(dbError);

            // Act
            await userController.getProfile(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.getUserById).toHaveBeenCalledWith(1);
            expect(mockNext).toHaveBeenCalledWith(dbError);
            expect(mockResponse.status).not.toHaveBeenCalled();
            expect(mockResponse.json).not.toHaveBeenCalled();
        });
    });

    describe("getAllUser", () => {
        it("should return all users when users exist", async () => {
            // Arrange
            const mockUsers = [
                testUser,
                {
                    id: 2,
                    name: "user2",
                    email: "user2@test.com",
                    role: Role.USER,
                },
            ];

            (userService.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

            // Act
            await userController.getAllUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.getAllUsers).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "success",
                data: mockUsers,
            });
        });

        it("should return empty array when no users exist", async () => {
            // Arrange
            (userService.getAllUsers as jest.Mock).mockResolvedValue(null);

            // Act
            await userController.getAllUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.getAllUsers).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "success",
                data: [],
            });
        });

        it("should handle errors from userService.getAllUsers", async () => {
            // Arrange
            const dbError = new Error("Database error");
            (userService.getAllUsers as jest.Mock).mockRejectedValue(dbError);

            // Act
            await userController.getAllUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.getAllUsers).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(dbError);
        });
    });

    describe("getUser", () => {
        it("should return user data when valid user id is provided", async () => {
            // Arrange
            const mockUser = {
                id: 5,
                name: "specificUser",
                email: "specific@test.com",
                createdAt: new Date("2024-01-01"),
                updatedAt: new Date("2024-01-02"),
                get createdAtLocal() {
                    return this.createdAt.toLocaleString("fr-FR");
                },
            };

            mockRequest.params = { id: "5" };
            (userService.getUserById as jest.Mock).mockResolvedValue(mockUser);

            // Act
            await userController.getUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.getUserById).toHaveBeenCalledWith(5);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "success",
                data: {
                    id: mockUser.id,
                    name: mockUser.name,
                    email: mockUser.email,
                    createdAt: expect.any(String),
                    updatedAt: mockUser.updatedAt,
                },
            });
        });

        it("should throw error when userId is undefined", async () => {
            // Arrange
            mockRequest.params = {};

            // Act
            await userController.getUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe("Missing userId.");
            expect(error.statusCode).toBe(404);
            expect(userService.getUserById).not.toHaveBeenCalled();
        });

        it("should throw error when user is not found", async () => {
            // Arrange
            mockRequest.params = { id: "999" };
            (userService.getUserById as jest.Mock).mockResolvedValue(null);

            // Act
            await userController.getUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.getUserById).toHaveBeenCalledWith(999);
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe("User not found.");
            expect(error.statusCode).toBe(404);
        });

        it("should handle errors from userService.getUserById", async () => {
            // Arrange
            const dbError = new Error("Database error");
            mockRequest.params = { id: "1" };
            (userService.getUserById as jest.Mock).mockRejectedValue(dbError);

            // Act
            await userController.getUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.getUserById).toHaveBeenCalledWith(1);
            expect(mockNext).toHaveBeenCalledWith(dbError);
            expect(mockResponse.json).not.toHaveBeenCalled();
        });

        it("should correctly parse string id to number", async () => {
            // Arrange
            const mockUser = {
                id: 123,
                name: "testUser",
                email: "test@test.com",
                createdAt: new Date(),
                updatedAt: new Date(),
                get createdAtLocal() {
                    return this.createdAt.toLocaleString("fr-FR");
                },
            };

            mockRequest.params = { id: "123" };
            (userService.getUserById as jest.Mock).mockResolvedValue(mockUser);

            // Act
            await userController.getUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.getUserById).toHaveBeenCalledWith(123);
        });
    });

    describe("updateUser", () => {
        it("should update user and return new tokens", async () => {
            // Arrange
            const mockAccessToken = "new-access-token";
            const mockRefreshToken = "new-refresh-token";
            const updatedUser = {
                id: 1,
                name: "updatedName",
                email: "updated@test.com",
                role: Role.ADMIN,
            };

            mockRequest.user = {
                id: 1,
                name: "oldName",
                role: "user",
            };
            mockRequest.body = {
                name: "updatedName",
                email: "updated@test.com",
                role: "admin",
            };

            (userService.updateUser as jest.Mock).mockResolvedValue(
                updatedUser
            );
            (userService.login as jest.Mock).mockReturnValue({
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
            });

            // Act
            await userController.updateUser(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.updateUser).toHaveBeenCalledWith(1, {
                name: "updatedName",
                email: "updated@test.com",
                role: "admin",
            });
            expect(userService.login).toHaveBeenCalledWith(updatedUser);
            expect(mockResponse.cookie).toHaveBeenCalledWith(
                "refreshToken",
                mockRefreshToken,
                {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "strict",
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                    path: "/users/refresh",
                }
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "success",
                data: {
                    user: {
                        id: updatedUser.id,
                        name: updatedUser.name,
                        role: updatedUser.role,
                    },
                    accessToken: mockAccessToken,
                },
            });
        });

        it("should throw error when user is not authenticated", async () => {
            // Arrange
            mockRequest.user = {} as any;
            mockRequest.body = {
                name: "newName",
                email: "new@test.com",
            };

            // Act
            await userController.updateUser(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe(
                "You need to be logged in to update your profile."
            );
            expect(error.statusCode).toBe(401);
            expect(userService.updateUser).not.toHaveBeenCalled();
        });

        it("should update only provided fields", async () => {
            // Arrange
            const updatedUser = {
                id: 1,
                name: "sameName",
                email: "new@test.com",
                role: Role.USER,
            };

            mockRequest.user = {
                id: 1,
                name: "sameName",
                role: "user",
            };
            mockRequest.body = {
                email: "new@test.com",
            };

            (userService.updateUser as jest.Mock).mockResolvedValue(
                updatedUser
            );
            (userService.login as jest.Mock).mockReturnValue({
                accessToken: "token",
                refreshToken: "refresh",
            });

            // Act
            await userController.updateUser(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.updateUser).toHaveBeenCalledWith(1, {
                name: undefined,
                email: "new@test.com",
                role: undefined,
            });
        });

        it("should handle errors from userService.updateUser", async () => {
            // Arrange
            const dbError = new AppError("Update failed", 500);
            mockRequest.user = {
                id: 1,
                name: "testUser",
                role: "user",
            };
            mockRequest.body = {
                name: "newName",
            };

            (userService.updateUser as jest.Mock).mockRejectedValue(dbError);

            // Act
            await userController.updateUser(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.updateUser).toHaveBeenCalledWith(1, {
                name: "newName",
                email: undefined,
                role: undefined,
            });
            expect(mockNext).toHaveBeenCalledWith(dbError);
            expect(userService.login).not.toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it("should update user role when provided", async () => {
            // Arrange
            const updatedUser = {
                id: 1,
                name: "testUser",
                email: "test@test.com",
                role: Role.ADMIN,
            };

            mockRequest.user = {
                id: 1,
                name: "testUser",
                role: "user",
            };
            mockRequest.body = {
                role: "admin",
            };

            (userService.updateUser as jest.Mock).mockResolvedValue(
                updatedUser
            );
            (userService.login as jest.Mock).mockReturnValue({
                accessToken: "token",
                refreshToken: "refresh",
            });

            // Act
            await userController.updateUser(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.updateUser).toHaveBeenCalledWith(1, {
                name: undefined,
                email: undefined,
                role: "admin",
            });
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        user: expect.objectContaining({
                            role: Role.ADMIN,
                        }),
                    }),
                })
            );
        });
    });

    describe("deleteUser", () => {
        it("should delete user and clear cookies when password is correct", async () => {
            // Arrange
            mockRequest.user = {
                id: 1,
                name: "testUser",
                role: "user",
            };
            mockRequest.body = {
                password: "correctPassword",
            };

            (userService.deleteUser as jest.Mock).mockResolvedValue(true);

            // Act
            await userController.deleteUser(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.deleteUser).toHaveBeenCalledWith(
                1,
                "correctPassword"
            );
            expect(mockResponse.clearCookie).toHaveBeenCalledWith(
                "refreshToken",
                {
                    path: "/users/refresh",
                }
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Account deleted successfully.",
            });
        });

        it("should throw error when user is not authenticated", async () => {
            // Arrange
            mockRequest.user = {} as any;
            mockRequest.body = {
                password: "somePassword",
            };

            // Act
            await userController.deleteUser(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe(
                "You need to be logged in to update your profile."
            );
            expect(error.statusCode).toBe(401);
            expect(userService.deleteUser).not.toHaveBeenCalled();
        });

        it("should throw error when password is incorrect", async () => {
            // Arrange
            mockRequest.user = {
                id: 1,
                name: "testUser",
                role: "user",
            };
            mockRequest.body = {
                password: "wrongPassword",
            };

            (userService.deleteUser as jest.Mock).mockResolvedValue(false);

            // Act
            await userController.deleteUser(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.deleteUser).toHaveBeenCalledWith(
                1,
                "wrongPassword"
            );
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe(
                "Cannot delete user account : Incorrect password."
            );
            expect(error.statusCode).toBe(401);
            expect(mockResponse.clearCookie).not.toHaveBeenCalled();
        });

        it("should handle errors from userService.deleteUser", async () => {
            // Arrange
            const dbError = new Error("Database error");
            mockRequest.user = {
                id: 1,
                name: "testUser",
                role: "user",
            };
            mockRequest.body = {
                password: "somePassword",
            };

            (userService.deleteUser as jest.Mock).mockRejectedValue(dbError);

            // Act
            await userController.deleteUser(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.deleteUser).toHaveBeenCalledWith(
                1,
                "somePassword"
            );
            expect(mockNext).toHaveBeenCalledWith(dbError);
            expect(mockResponse.clearCookie).not.toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });

    describe("deleteUserById", () => {
        it("should delete user by id and return success message", async () => {
            // Arrange
            mockRequest.params = { id: "5" };
            (userService.deleteUserById as jest.Mock).mockResolvedValue(
                undefined
            );

            // Act
            await userController.deleteUserById(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.deleteUserById).toHaveBeenCalledWith(5);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "success",
                message: "User: 5 has been deleted successfully.",
            });
        });

        it("should throw error when userId is undefined", async () => {
            // Arrange
            mockRequest.params = {};

            // Act
            await userController.deleteUserById(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalled();
            const error = (mockNext as jest.Mock).mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe("Missing userId");
            expect(error.statusCode).toBe(404);
            expect(userService.deleteUserById).not.toHaveBeenCalled();
        });

        it("should correctly parse string id to number", async () => {
            // Arrange
            mockRequest.params = { id: "999" };
            (userService.deleteUserById as jest.Mock).mockResolvedValue(
                undefined
            );

            // Act
            await userController.deleteUserById(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.deleteUserById).toHaveBeenCalledWith(999);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "User: 999 has been deleted successfully.",
                })
            );
        });

        it("should handle errors from userService.deleteUserById", async () => {
            // Arrange
            const dbError = new Error("Database error");
            mockRequest.params = { id: "1" };
            (userService.deleteUserById as jest.Mock).mockRejectedValue(
                dbError
            );

            // Act
            await userController.deleteUserById(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(userService.deleteUserById).toHaveBeenCalledWith(1);
            expect(mockNext).toHaveBeenCalledWith(dbError);
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });
});
