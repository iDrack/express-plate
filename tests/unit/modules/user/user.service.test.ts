import { Role } from "../../../../src/models/role";
import { User } from "../../../../src/models/user";
import * as bcrypt from "bcrypt";
import { AppError } from "../../../../src/middlewares/errorHandler";

// Mocked repository directly inside the Data source
jest.mock("../../../../src/config/database", () => {
    const mockRepository = {
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
    };

    return {
        AppDataSource: {
            getRepository: jest.fn(() => mockRepository),
        },
        mockRepository,
    };
});

jest.mock("../../../../src/modules/core/jwt.service", () => ({
    JwtService: {
        generateAccessToken: jest.fn(() => "mock-access-token"),
        generateRefreshToken: jest.fn(() => "mock-refresh-token"),
    },
}));

// Mock toRole function while keeping the Role enum
jest.mock("../../../../src/models/role", () => {
    const actual = jest.requireActual("../../../../src/models/role");
    return {
        ...actual,
        toRole: jest.fn(),
    };
});

import { AppDataSource } from "../../../../src/config/database";
import { userService } from "../../../../src/modules/user/user.service";
import { JwtService } from "../../../../src/modules/core/jwt.service";
import { toRole } from "../../../../src/models/role";

//const mockUserRepository = mockRepository as any;
const mockUserRepository = AppDataSource.getRepository(User) as any;

describe("UserService", () => {
    let testUser: User;
    let JwtService: any;

    beforeAll(async () => {
        // Import JWT service otherwise the mock won't work
        const module = await import("../../../../src/modules/core/jwt.service");
        JwtService = module.JwtService;
    });
    beforeEach(async () => {
        jest.clearAllMocks();

        testUser = new User();
        testUser.id = 1;
        testUser.name = "testUser";
        testUser.email = "test@test.com";
        testUser.password = await bcrypt.hash("testPassword", 10);
        testUser.role = Role.USER;
    });

    describe("testCredentials", () => {
        it("should return a valid user if credentials are corrects", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(testUser);

            //Act
            const result = await userService.testCredentials(
                "testUser",
                "",
                "testPassword"
            );

            //Assert
            expect(result).toEqual(testUser);
            expect(mockUserRepository.findOne).toHaveBeenCalledWith({
                where: { name: "testUser" },
            });
        });

        it("should throw an AppError when email and username is missing.", async () => {
            //Assert
            await expect(
                userService.testCredentials("", "", "testPassword")
            ).rejects.toThrow(AppError);
        });

        it("should throw an AppError when user cannot be found in the database", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(null);

            //Act & Assert
            await expect(
                userService.testCredentials(
                    "testUser",
                    "test@test.com",
                    "testPassword"
                )
            ).rejects.toThrow(AppError);
        });

        it("should throw an AppError when password is incorrect", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(testUser);
            //Act & Assert
            await expect(
                userService.testCredentials(
                    "testUser",
                    "test@test.com",
                    "wrongPassword"
                )
            ).rejects.toThrow(AppError);
        });
    });

    describe("login", () => {
        it("should create an accessToken and a refreshToken", () => {
            //Act
            const result = userService.login(testUser);

            //Assert
            expect(result.accessToken).toBe("mock-access-token");
            expect(result.refreshToken).toBe("mock-refresh-token");
            expect(JwtService.generateAccessToken).toHaveBeenCalledWith({
                id: testUser.id,
                name: testUser.name,
                role: testUser.role,
            });
            expect(JwtService.generateRefreshToken).toHaveBeenCalledWith({
                id: testUser.id,
                name: testUser.name,
                role: testUser.role,
            });
        });
    });

    describe("getUserById", () => {
        it("should return the correct user when using a valid id", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(testUser);

            //Act
            const result = await userService.getUserById(1);

            //Assert
            expect(result).toBe(testUser);
        });

        it("should throw a 404 AppError when the id doesn't correspond to a saved user", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(null);

            //Act & Assert
            await expect(userService.getUserById(1)).rejects.toThrow(AppError);
            await expect(userService.getUserById(1)).rejects.toHaveProperty(
                "statusCode",
                404
            );
        });
    });

    describe("checkUserExist", () => {
        it("should return true when the id correspond to a user in the database", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(testUser);

            //Act
            const result = await userService.checkUserExist(1);

            //Assert
            expect(result).toBe(true);
        });

        it("should return false when the id doesn't correspond to a user in the databse", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(null);

            //Act
            const result = await userService.checkUserExist(1);

            //Act & Assert
            expect(result).toBe(false);
        });
    });

    describe("getUserByName", () => {
        it("should return the correct user when using a valid username", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(testUser);

            //Act
            const result = await userService.getUserByName("test");

            //Assert
            expect(result).toBe(testUser);
        });

        it("should throw a 404 AppError when the username doesn't correspond to a saved user", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(null);

            //Act & Assert
            await expect(userService.getUserByName("test")).rejects.toThrow(
                AppError
            );
            await expect(
                userService.getUserByName("test")
            ).rejects.toHaveProperty("statusCode", 404);
        });
    });

    describe("getUserByEmail", () => {
        it("should return the correct user when using a valid email", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(testUser);

            //Act
            const result = await userService.getUserByEmail("test@test.com");

            //Assert
            expect(result).toBe(testUser);
        });

        it("should throw a 404 AppError when the email doesn't correspond to a saved user", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(null);

            //Act & Assert
            await expect(
                userService.getUserByEmail("test@test.com")
            ).rejects.toThrow(AppError);
            await expect(
                userService.getUserByEmail("test@test.com")
            ).rejects.toHaveProperty("statusCode", 404);
        });
    });

    describe("getAllUsers", () => {
        it("should return all the users saved in the database", async () => {
            //Arrange
            mockUserRepository.find.mockResolvedValue([testUser, testUser]);
            //Act
            const result = await userService.getAllUsers();
            //Assert
            expect(result.length).toBe(2);
            expect(result[0]).toBe(testUser);
        });

        it("should return an empty array when no user are present in the database", async () => {
            //Arrange
            mockUserRepository.find.mockResolvedValue([]);
            //Act
            const result = await userService.getAllUsers();
            //Assert
            expect(result.length).toBe(0);
            expect(result).toStrictEqual([]);
        });
    });
    describe("createUser", () => {
        it("should create and return a new user with valid credentials", async () => {
            //Arrange
            const newUser = new User();
            newUser.name = "newUser";
            newUser.email = "new@test.com";
            newUser.password = "hashedPassword";

            mockUserRepository.create.mockReturnValue(newUser);
            mockUserRepository.save.mockResolvedValue(newUser);

            //Act
            const result = await userService.createUser(
                "newUser",
                "new@test.com",
                "ValidPass123!"
            );

            //Assert
            expect(result).toBe(newUser);
            expect(mockUserRepository.create).toHaveBeenCalledWith({
                name: "newUser",
                email: "new@test.com",
                password: expect.any(String),
            });
            expect(mockUserRepository.save).toHaveBeenCalledWith(newUser);
        });

        it("should throw an AppError with status 400 when password format is invalid", async () => {
            //Arrange & Act & Assert
            try {
                await userService.createUser("newUser", "new@test.com", "weak");
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeInstanceOf(AppError);
                expect(error.statusCode).toBe(400);
                expect(error.message).toBe("Invalid password format.");
            }
        });

        it("should hash the password before saving", async () => {
            //Arrange
            const newUser = new User();
            newUser.name = "newUser";
            newUser.email = "new@test.com";

            mockUserRepository.create.mockReturnValue(newUser);
            mockUserRepository.save.mockResolvedValue(newUser);

            //Act
            await userService.createUser(
                "newUser",
                "new@test.com",
                "ValidPass123!"
            );

            //Assert
            const createCall = mockUserRepository.create.mock.calls[0][0];
            expect(createCall.password).not.toBe("ValidPass123!");
            expect(createCall.password).toBeDefined();
        });
    });

    describe("updateUser", () => {
        it("should update the user information", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(testUser);
            const updatedUser = testUser;
            updatedUser.name = "newName";
            updatedUser.email = "newEmail@test.com";
            updatedUser.role = Role.ADMIN;

            (toRole as jest.Mock).mockReturnValue(Role.ADMIN);
            mockUserRepository.save.mockResolvedValue(updatedUser);

            //Act
            const result = await userService.updateUser(testUser.id, {
                name: "newUser",
                email: "newEmail@test.com",
                role: "admin",
            });

            //Assert
            expect(result).toBe(updatedUser);
            expect(toRole).toHaveBeenCalledWith("admin");
        });

        it("should throw AppError with status 404 if the user doesn't exist", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(null);
            const updatedUser = testUser;
            updatedUser.name = "newName";
            updatedUser.email = "newEmail@test.com";
            updatedUser.role = Role.ADMIN;
            //Act & Assert
            try {
                await userService.updateUser(testUser.id, {
                    name: "newUser",
                    email: "newEmail@test.com",
                    role: "admin",
                });
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeInstanceOf(AppError);
                expect(error.statusCode).toBe(404);
                expect(error.message).toBe("User not found.");
            }
        });
    });

    describe("updateUserPassword", () => {
        it("should update the password and hash it before saving", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(testUser);
            mockUserRepository.save.mockResolvedValue(testUser);

            //Act
            await userService.updatePassword(
                1,
                "testPassword",
                "ValidPass123!"
            );

            //Assert
            const updateCall = mockUserRepository.save.mock.calls[0][0];
            expect(updateCall.password).not.toBe("ValidPass123!");
            expect(updateCall.password).not.toBe("testPassword");
            expect(updateCall.password).toBeDefined();
            // Verify the new password is correctly hashed
            const isValidHash = await bcrypt.compare(
                "ValidPass123!",
                updateCall.password
            );
            expect(isValidHash).toBe(true);
        });

        it("should throw AppError with status 401 when old password is incorrect", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(testUser);

            //Act & Assert
            try {
                await userService.updatePassword(
                    1,
                    "wrongPassword",
                    "ValidPass123!"
                );
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeInstanceOf(AppError);
                expect(error.statusCode).toBe(401);
                expect(error.message).toBe("Incorrect password.");
            }
        });

        it("should throw AppError with status 405 when new password is same as old", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(testUser);

            //Act & Assert
            try {
                await userService.updatePassword(
                    1,
                    "testPassword",
                    "testPassword"
                );
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeInstanceOf(AppError);
                expect(error.statusCode).toBe(405);
                expect(error.message).toBe(
                    "New password cannot be the same as old one."
                );
            }
        });

        it("should throw AppError with status 400 when new password format is invalid", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(testUser);

            //Act & Assert
            try {
                await userService.updatePassword(1, "testPassword", "weak");
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeInstanceOf(AppError);
                expect(error.statusCode).toBe(400);
                expect(error.message).toBe("Invalid password format.");
            }
        });

        it("should throw AppError with status 404 when user does not exist", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(null);

            //Act & Assert
            try {
                await userService.updatePassword(
                    999,
                    "testPassword",
                    "ValidPass123!"
                );
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeInstanceOf(AppError);
                expect(error.statusCode).toBe(404);
                expect(error.message).toBe("User not found.");
            }
        });
    });

    describe("deleteUserById", () => {
        it("should delete a user and return true when user exists", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(testUser);
            mockUserRepository.delete.mockResolvedValue({ affected: 1 });

            //Act
            const result = await userService.deleteUserById(1);

            //Assert
            expect(result).toBe(true);
            expect(mockUserRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(mockUserRepository.delete).toHaveBeenCalledWith(1);
        });

        it("should throw an AppError with status 404 when user does not exist", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(null);

            //Act & Assert
            try {
                await userService.deleteUserById(999);
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeInstanceOf(AppError);
                expect(error.statusCode).toBe(404);
                expect(error.message).toBe("User not found.");
            }
        });
    });

    describe("deleteUser", () => {
        it("should delete a user and return true when user exists and password is correct", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(testUser);
            mockUserRepository.delete.mockResolvedValue({ affected: 1 });

            //Act
            const result = await userService.deleteUser(1, "testPassword");

            //Assert
            expect(result).toBe(true);
            expect(mockUserRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(mockUserRepository.delete).toHaveBeenCalledWith(1);
        });

        it("should throw an AppError with status 401 when password is incorrect", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(testUser);

            //Act & Assert
            try {
                await userService.deleteUser(1, "wrongPassword");
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeInstanceOf(AppError);
                expect(error.statusCode).toBe(401);
                expect(error.message).toBe(
                    "Cannot delete user account : Incorrect password."
                );
            }
        });

        it("should throw an AppError with status 404 when user does not exist", async () => {
            //Arrange
            mockUserRepository.findOne.mockResolvedValue(null);

            //Act & Assert
            try {
                await userService.deleteUser(999, "testPassword");
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeInstanceOf(AppError);
                expect(error.statusCode).toBe(404);
                expect(error.message).toBe("User not found.");
            }
        });
    });
});
