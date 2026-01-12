import { AppError } from "../../../../src/middlewares/errorHandler";

// Mock env var first thing first
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-key";
process.env.JWT_EXPIRES_IN = "1h";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";

describe("Jwt service class", () => {
    let JwtService: any;

    beforeAll(async () => {
        // Import service
        const module = await import("../../../../src/modules/core/jwt.service");
        JwtService = module.JwtService;
    });

    describe("generateAccessToken", () => {
        it("should generate access token when payload is valid", () => {
            //Arrange
            const payloadTest = {
                id: 1,
                name: "test user",
                role: "Admin",
            };

            //Act
            const result = JwtService.generateAccessToken(payloadTest);

            //Assert
            expect(result).toEqual(expect.any(String));
            expect(result).toBeTruthy();
        });

        it("should throw Error when payload is undefined", () => {
            //Arrange
            const payloadTest = undefined;

            //Act & Assert
            expect(() => {
                JwtService.generateAccessToken(payloadTest);
            }).toThrow();

            expect(() => {
                JwtService.generateAccessToken(payloadTest);
            }).toThrow(Error);
        });

        it("should throw AppError when payload is empty", () => {
            //Arrange
            const payloadTest = {};

            //Act & Assert
            expect(() => {
                JwtService.generateAccessToken(payloadTest);
            }).toThrow();

            expect(() => {
                JwtService.generateAccessToken(payloadTest);
            }).toThrow(AppError);
        });

        it("should throw AppError when payload is partial", () => {
            //Arrange
            const payloadTest = {
                name: "test",
            };

            //Act & Assert
            expect(() => {
                JwtService.generateAccessToken(payloadTest);
            }).toThrow();

            expect(() => {
                JwtService.generateAccessToken(payloadTest);
            }).toThrow(AppError);
        });

        it("should throw AppError when JWT_SECRET is missing", () => {
            //Arrange
            const payloadTest = {
                id: 1,
                name: "test",
                role: "admin",
            };
            const originalSecret = (JwtService as any).SECRET;
            (JwtService as any).SECRET = undefined;

            //Act & Assert
            expect(() => {
                JwtService.generateAccessToken(payloadTest);
            }).toThrow(AppError);

            expect(() => {
                JwtService.generateAccessToken(payloadTest);
            }).toThrow("Missing JWT secret in .env.");

            (JwtService as any).SECRET = originalSecret;
        });

        it("should throw AppError when EXPIRES_IN is missing", () => {
            //Arrange
            const payloadTest = {
                id: 1,
                name: "test",
                role: "admin",
            };
            const originalSecret = (JwtService as any).EXPIRES_IN;
            (JwtService as any).EXPIRES_IN = undefined;

            //Act & Assert
            expect(() => {
                JwtService.generateAccessToken(payloadTest);
            }).toThrow(AppError);

            expect(() => {
                JwtService.generateAccessToken(payloadTest);
            }).toThrow("Missing JWT secret in .env.");

            (JwtService as any).EXPIRES_IN = originalSecret;
        });
    });

    describe("generateRefreshToken", () => {
        it("should generate refresh token when payload is valid", () => {
            //Arrange
            const payloadTest = {
                id: 1,
                name: "test user",
                role: "Admin",
            };

            //Act
            const result = JwtService.generateRefreshToken(payloadTest);

            //Assert
            expect(result).toEqual(expect.any(String));
            expect(result).toBeTruthy();
        });

        it("should throw Error when payload is undefined", () => {
            //Arrange
            const payloadTest = undefined;

            //Act & Assert
            expect(() => {
                JwtService.generateRefreshToken(payloadTest);
            }).toThrow();

            expect(() => {
                JwtService.generateRefreshToken(payloadTest);
            }).toThrow(Error);
        });

        it("should throw AppError when payload is empty", () => {
            //Arrange
            const payloadTest = {};

            //Act & Assert
            expect(() => {
                JwtService.generateRefreshToken(payloadTest);
            }).toThrow();

            expect(() => {
                JwtService.generateRefreshToken(payloadTest);
            }).toThrow(AppError);
        });

        it("should throw AppError when payload is partial", () => {
            //Arrange
            const payloadTest = {
                name: "test",
            };

            //Act & Assert
            expect(() => {
                JwtService.generateRefreshToken(payloadTest);
            }).toThrow();

            expect(() => {
                JwtService.generateRefreshToken(payloadTest);
            }).toThrow(AppError);
        });

        it("should throw AppError when REFRESH_SECRET is missing", () => {
            //Arrange
            const payloadTest = {
                id: 1,
                name: "test",
                role: "admin",
            };
            const originalSecret = (JwtService as any).REFRESH_SECRET;
            (JwtService as any).REFRESH_SECRET = undefined;

            //Act & Assert
            expect(() => {
                JwtService.generateRefreshToken(payloadTest);
            }).toThrow(AppError);

            expect(() => {
                JwtService.generateRefreshToken(payloadTest);
            }).toThrow("Missing JWT refresh secrets in .env.");

            (JwtService as any).REFRESH_SECRET = originalSecret;
        });

        it("should throw AppError when REFRESH_EXPIRES_IN is missing", () => {
            //Arrange
            const payloadTest = {
                id: 1,
                name: "test",
                role: "admin",
            };
            const originalSecret = (JwtService as any).REFRESH_EXPIRES_IN;
            (JwtService as any).REFRESH_EXPIRES_IN = undefined;

            //Act & Assert
            expect(() => {
                JwtService.generateRefreshToken(payloadTest);
            }).toThrow(AppError);

            expect(() => {
                JwtService.generateRefreshToken(payloadTest);
            }).toThrow("Missing JWT refresh secrets in .env.");

            (JwtService as any).REFRESH_EXPIRES_IN = originalSecret;
        });
    });

    describe("verifyAccessToken", () => {
        it("should return correct payload", () => {
            //Arrange
            const payloadTest = {
                id: 1,
                name: "test",
                role: "admin",
            };

            //Act
            const token = JwtService.generateAccessToken(payloadTest);
            const result = JwtService.verifyAccessToken(token);

            //Assert
            expect(result.id).toBe(payloadTest.id);
            expect(result.name).toBe(payloadTest.name);
            expect(result.role).toBe(payloadTest.role);
            expect(result.iat).toEqual(expect.any(Number));
            expect(result.exp).toEqual(expect.any(Number));
        });

        it("should throw AppError when token is invalid", () => {
            //Arrange
            const token = "test";

            //Act & Assert
            expect(() => {
                JwtService.verifyAccessToken(token)
            }).toThrow("Invalid or expired token.")
        });

        it("should throw AppError when JWT_SECRET is missing", () => {
            //Arrange
            const payloadTest = {
                id: 1,
                name: "test",
                role: "admin",
            };
            const token = JwtService.generateAccessToken(payloadTest);

            const originalSecret = (JwtService as any).SECRET;
            (JwtService as any).SECRET = undefined;

            //Act & Assert
            expect(() => {
                JwtService.verifyAccessToken(token)
            }).toThrow("Missing JWT secret in .env.");
            (JwtService as any).SECRET = originalSecret;
        });
    });

    describe("verifyRefreshToken", () => {
        it("should return correct payload", () => {
            //Arrange
            const payloadTest = {
                id: 1,
                name: "test",
                role: "admin",
            };

            //Act
            const token = JwtService.generateRefreshToken(payloadTest);
            const result = JwtService.verifyRefreshToken(token);

            //Assert
            expect(result.id).toBe(payloadTest.id);
            expect(result.name).toBe(payloadTest.name);
            expect(result.role).toBe(payloadTest.role);
            expect(result.iat).toEqual(expect.any(Number));
            expect(result.exp).toEqual(expect.any(Number));
        });

        it("should throw AppError when token is invalid", () => {
            //Arrange
            const token = "test";

            //Act & Assert
            expect(() => {
                JwtService.verifyRefreshToken(token)
            }).toThrow("Invalid or expired refresh token.")
        });

        it("should throw AppError when JWT_SECRET is missing", () => {
            //Arrange
            const payloadTest = {
                id: 1,
                name: "test",
                role: "admin",
            };
            const token = JwtService.generateRefreshToken(payloadTest);

            const originalSecret = (JwtService as any).REFRESH_SECRET;
            (JwtService as any).REFRESH_SECRET = undefined;

            //Act & Assert
            expect(() => {
                JwtService.verifyRefreshToken(token)
            }).toThrow("Missing JWT refresh secret in .env.");
            (JwtService as any).REFRESH_SECRET = originalSecret;
        });
    })
});
