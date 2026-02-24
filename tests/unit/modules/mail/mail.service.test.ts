import "reflect-metadata";
import { Container } from "typedi";
import { MockContainer } from "../../../utils/mockContainer";
import nodemailer from "nodemailer";
import { MailService } from "../../../../src/modules/mail/mail.service";
import { ResetPasswordMail } from "../../../../src/modules/mail/templates/ResetPasswordMail";
import type { User } from "../../../../src/models/user";
import { Role } from "../../../../src/models/role";

// Mock nodemailer
jest.mock("nodemailer");

// Mock logger
jest.mock("../../../../src/config/logger", () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

describe("MailService", () => {
    let mailService: MailService;
    let mockTransporter: any;
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        Container.reset();
        // Save original environment variables
        originalEnv = { ...process.env };

        // Setup default test environment variables
        process.env.NODE_ENV = "test";
        process.env.MAIL_HOST = "smtp.test.com";
        process.env.MAIL_PORT = "587";
        process.env.MAIL_USER = "test@test.com";
        process.env.MAIL_PASSWORD = "testpassword";
        process.env.CLIENT_URL = "http://localhost:3000";

        // Mock transporter
        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue({
                messageId: "test-message-id",
                accepted: ["test@test.com"],
                rejected: [],
                response: "250 OK",
            }),
        };

        // Mock nodemailer.createTransport
        (nodemailer.createTransport as jest.Mock).mockReturnValue(
            mockTransporter,
        );

        jest.clearAllMocks();

        // Initialize MailService via TypeDI Container after mocks are set up
        mailService = Container.get(MailService);
    });

    afterEach(() => {
        // Restore original environment variables
        process.env = originalEnv;
    });

    describe("Constructor", () => {
        it("should create a MailService instance with test credentials", () => {
            //Act & Assert
            expect(mailService).toBeInstanceOf(MailService);
            expect(nodemailer.createTransport).toHaveBeenCalledWith({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: "test@test.com",
                    pass: "testpassword",
                },
            });
        });

        it("should create a MailService instance with production credentials", () => {
            //Arrange
            process.env.NODE_ENV = "production";
            process.env.MAIL_PORT = "465";

            // Reset container and create new instance
            Container.reset();
            const prodMailService = Container.get(MailService);

            //Assert
            expect(prodMailService).toBeInstanceOf(MailService);
            expect(nodemailer.createTransport).toHaveBeenCalledWith({
                host: "smtp.test.com",
                port: 465,
                secure: true,
                auth: {
                    user: "test@test.com",
                    pass: "testpassword",
                },
            });
        });

        it("should throw error in production mode when MAIL_HOST is missing", () => {
            //Arrange
            process.env.NODE_ENV = "production";
            delete process.env.MAIL_HOST;

            // Reset container
            Container.reset();

            //Act & Assert
            expect(() => Container.get(MailService)).toThrow(
                "Missing required mail configuration in production mode",
            );
        });

        it("should throw error in production mode when MAIL_PORT is missing", () => {
            //Arrange
            process.env.NODE_ENV = "production";
            delete process.env.MAIL_PORT;

            // Reset container
            Container.reset();

            //Act & Assert
            expect(() => Container.get(MailService)).toThrow(
                "Missing required mail configuration in production mode",
            );
        });

        it("should throw error in production mode when MAIL_USER is missing", () => {
            //Arrange
            process.env.NODE_ENV = "production";
            delete process.env.MAIL_USER;

            // Reset container
            Container.reset();

            //Act & Assert
            expect(() => Container.get(MailService)).toThrow(
                "Missing required mail configuration in production mode",
            );
        });

        it("should throw error in production mode when MAIL_PASSWORD is missing", () => {
            //arrange
            process.env.NODE_ENV = "production";
            delete process.env.MAIL_PASSWORD;

            // Reset container
            Container.reset();

            //Act & Assert
            expect(() => Container.get(MailService)).toThrow(
                "Missing required mail configuration in production mode",
            );
        });

        it("should return the same instance when called multiple times (singleton)", () => {
            const instance1 = Container.get(MailService);
            const instance2 = Container.get(MailService);

            expect(instance1).toBe(instance2);
        });
    });

    describe("sendEmail", () => {
        it("should send an email successfully", async () => {
            //Arrange
            const mail = {
                to: "recipient@test.com",
                subject: "Test Subject",
                body: "<p>Test Body</p>",
                text: "Test Body",
            };

            //act
            const result = await mailService.sendEmail(mail);

            //Assert
            expect(mockTransporter.sendMail).toHaveBeenCalledWith({
                from: "test@test.com",
                to: "recipient@test.com",
                subject: "Test Subject",
                html: "<p>Test Body</p>",
                text: "Test Body",
            });

            expect(result).toEqual({
                messageId: "test-message-id",
                accepted: ["test@test.com"],
                rejected: [],
                response: "250 OK",
            });
        });

        it("should handle sendMail errors", async () => {
            //arrange
            const mail = {
                to: "recipient@test.com",
                subject: "Test Subject",
                body: "<p>Test Body</p>",
                text: "Test Body",
            };

            //Act
            const mockError = new Error("SMTP error");
            mockTransporter.sendMail.mockRejectedValue(mockError);

            //Assert
            await expect(mailService.sendEmail(mail)).rejects.toThrow(
                "SMTP error",
            );
        });
    });

    describe("resetEmailRequest", () => {
        it("should send password reset email successfully", async () => {
            //Arrange
            const testUser: User = {
                id: 1,
                name: "Test User",
                email: "user@test.com",
                password: "hashedpassword",
                role: Role.USER,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdAtLocal: "2026-01-30",
                files: [],
            };
            const token = "test-reset-token";

            //Act
            const result = await mailService.resetEmailRequest(testUser, token);

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: "test@test.com",
                    to: "user@test.com",
                    subject: "Password reset request.",
                }),
            );

            //Assert
            const callArgs = mockTransporter.sendMail.mock.calls[0][0];
            expect(callArgs.html).toContain("password reset");
            expect(callArgs.html).toContain(
                `http://localhost:3000/reset-password?token=${encodeURIComponent(token)}`,
            );

            expect(result).toEqual({
                messageId: "test-message-id",
                accepted: ["test@test.com"],
                rejected: [],
                response: "250 OK",
            });
        });

        it("should handle errors when sending reset email", async () => {
            //Arrange
            const testUser: User = {
                id: 1,
                name: "Test User",
                email: "user@test.com",
                password: "hashedpassword",
                role: Role.USER,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdAtLocal: "2026-01-30",
                files: [],
            };
            const token = "test-reset-token";

            const mockError = new Error("Email sending failed");
            mockTransporter.sendMail.mockRejectedValue(mockError);

            //Act & Assert
            await expect(
                mailService.resetEmailRequest(testUser, token),
            ).rejects.toThrow("Email sending failed");
        });
    });

    describe("ResetPasswordMail", () => {
        it("should create a properly formatted reset password email", () => {
            //Arrange
            const testUser: User = {
                id: 1,
                name: "Test User",
                email: "user@test.com",
                password: "hashedpassword",
                role: Role.USER,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdAtLocal: "2026-01-30",
                files: []
            };
            const token = "test-reset-token";

            //Act
            const resetMail = new ResetPasswordMail(testUser, token);

            //Assert
            expect(resetMail.to).toBe("user@test.com");
            expect(resetMail.subject).toBe("Password reset request.");
            expect(resetMail.body).toContain("password reset");
            expect(resetMail.body).toContain(
                `http://localhost:3000/reset-password?token=${encodeURIComponent(token)}`,
            );
            expect(resetMail.text).not.toContain("<");
            expect(resetMail.text).not.toContain(">");
        });

        it("should properly encode special characters in token", () => {
            //Arrange
            const testUser: User = {
                id: 1,
                name: "Test User",
                email: "user@test.com",
                password: "hashedpassword",
                role: Role.USER,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdAtLocal: "2026-01-30",
                files: [],
            };
            const token = "token+with/special=chars&more";

            //Act
            const resetMail = new ResetPasswordMail(testUser, token);

            //Assert
            expect(resetMail.body).toContain(
                `http://localhost:3000/reset-password?token=${encodeURIComponent(token)}`,
            );
            expect(resetMail.body).not.toContain("token+with/special=chars");
        });
    });
});
