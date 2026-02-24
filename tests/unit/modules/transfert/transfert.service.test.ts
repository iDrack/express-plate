import "reflect-metadata";
import { Container } from "typedi";
import { MockContainer } from "../../../utils/mockContainer";
import { TransfertService } from "../../../../src/modules/transfert/transfert.service";
import { AppError } from "../../../../src/middlewares/errorHandler";
import { Role } from "../../../../src/models/role";
import type { FileMetaData } from "../../../../src/modules/transfert/transfert.types";

jest.mock("../../../../src/modules/user/user.service", () => ({
    UserService: jest.fn().mockImplementation(() => ({
        getUserById: jest.fn(),
    })),
}));

jest.mock("../../../../src/models/fileInfo", () => ({
    FileInfo: class FileInfo {
        id!: number;
        originalName!: string;
        storedAs!: string;
        path!: string;
        size!: number;
        mimeType!: string;
        user!: any;
        createdAt!: Date;
        updatedAt!: Date;
        createdAtLocal!: string;
    },
}));

jest.mock("../../../../src/models/user", () => ({
    User: class User {
        id!: number;
        name!: string;
        email!: string;
        password!: string;
        role!: any;
        createdAt!: Date;
        updatedAt!: Date;
        createdAtLocal!: string;
    },
}));

// Mock database
jest.mock("../../../../src/config/database", () => {
    const mockRepository = {
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    };

    return {
        AppDataSource: {
            getRepository: jest.fn(() => mockRepository),
        },
        mockRepository,
    };
});

// Mock fs
jest.mock("fs", () => ({
    rmSync: jest.fn(),
}));

import { AppDataSource } from "../../../../src/config/database";
import fs from "fs";
import { FileInfo } from "../../../../src/models/fileInfo";
import { User } from "../../../../src/models/user";
import { UserService } from "../../../../src/modules/user/user.service";

const mockFileInfoRepository = AppDataSource.getRepository(FileInfo) as any;
const mockFs = jest.mocked(fs);

describe("TransfertService", () => {
    let transfertService: TransfertService;
    let mockUserService: jest.Mocked<any>;
    let testUser: any;
    let testFileInfo: any;

    beforeEach(() => {
        MockContainer.reset();

        // Create mock UserService instance
        mockUserService = {
            getUserById: jest.fn(),
        };

        // Register mock in container
        Container.set(UserService, mockUserService);

        transfertService = Container.get(TransfertService);

        // Test data setup
        testUser = {
            id: 1,
            name: "testUser",
            email: "test@test.com",
            password: "hashedpassword",
            role: Role.USER,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdAtLocal: "2026-02-21",
        };

        testFileInfo = {
            id: 1,
            originalName: "test-file.txt",
            storedAs: "stored-filename.txt",
            path: "/uploads/stored-filename.txt",
            size: 1024,
            mimeType: "text/plain",
            user: testUser,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdAtLocal: "2026-02-21",
        };
    });

    describe("getFileById", () => {
        it("should return file info when file exists", async () => {
            // Arrange
            mockFileInfoRepository.findOne.mockResolvedValue(testFileInfo);

            // Act
            const result = await transfertService.getFileById(1);

            // Assert
            expect(result).toBe(testFileInfo);
            expect(mockFileInfoRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: ["user"],
            });
        });

        it("should throw AppError when file does not exist", async () => {
            // Arrange
            mockFileInfoRepository.findOne.mockResolvedValue(null);

            // Act & Assert
            await expect(transfertService.getFileById(1)).rejects.toThrow(
                new AppError("File is missing.", 404),
            );
        });

        it("should throw AppError when file is undefined", async () => {
            // Arrange
            mockFileInfoRepository.findOne.mockResolvedValue(undefined);

            // Act & Assert
            await expect(transfertService.getFileById(1)).rejects.toThrow(
                new AppError("File is missing.", 404),
            );
        });
    });

    describe("countNbFiles", () => {
        it("should return the number of files", async () => {
            // Arrange
            mockFileInfoRepository.count.mockResolvedValue(5);

            // Act
            const result = await transfertService.countNbFiles();

            // Assert
            expect(result).toBe(5);
            expect(mockFileInfoRepository.count).toHaveBeenCalled();
        });

        it("should return 0 when no files exist", async () => {
            // Arrange
            mockFileInfoRepository.count.mockResolvedValue(0);

            // Act
            const result = await transfertService.countNbFiles();

            // Assert
            expect(result).toBe(0);
        });
    });

    describe("uploadFile", () => {
        it("should upload file and return metadata", async () => {
            // Arrange
            const mockFile = {
                originalname: "test-file.txt",
                filename: "stored-filename.txt",
                path: "/uploads/stored-filename.txt",
                size: 1024,
                mimetype: "text/plain",
            } as Express.Multer.File;

            mockUserService.getUserById.mockResolvedValue(testUser);
            mockFileInfoRepository.create.mockReturnValue(testFileInfo);
            mockFileInfoRepository.save.mockResolvedValue(testFileInfo);

            // Act
            const result = await transfertService.uploadFile(mockFile, 1);

            // Assert
            expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
            expect(mockFileInfoRepository.create).toHaveBeenCalledWith({
                originalName: "test-file.txt",
                storedAs: "stored-filename.txt",
                path: "/uploads/stored-filename.txt",
                size: 1024,
                mimeType: "text/plain",
                user: testUser,
            });
            expect(mockFileInfoRepository.save).toHaveBeenCalledWith(
                testFileInfo,
            );
            expect(result).toEqual({
                id: 1,
                originalName: "test-file.txt",
                storedAs: "stored-filename.txt",
                size: 1024,
                mimeType: "text/plain",
                userId: 1,
            });
        });

        it("should throw error when user does not exist", async () => {
            // Arrange
            const mockFile = {
                originalname: "test-file.txt",
                filename: "stored-filename.txt",
                path: "/uploads/stored-filename.txt",
                size: 1024,
                mimetype: "text/plain",
            } as Express.Multer.File;

            mockUserService.getUserById!.mockRejectedValue(
                new AppError("User not found.", 404),
            );

            // Act & Assert
            await expect(
                transfertService.uploadFile(mockFile, 999),
            ).rejects.toThrow(new AppError("User not found.", 404));
        });
    });

    describe("getFilesByUserId", () => {
        it("should return array of file metadata for user", async () => {
            // Arrange
            const filesInfo = [testFileInfo];
            mockFileInfoRepository.find.mockResolvedValue(filesInfo);

            // Act
            const result = await transfertService.getFilesByUserId(1, 0, 10);

            // Assert
            expect(mockFileInfoRepository.find).toHaveBeenCalledWith({
                where: { user: { id: 1 } },
                skip: 0,
                take: 10,
                relations: ["user"],
            });
            expect(result).toEqual([
                {
                    id: 1,
                    originalName: "test-file.txt",
                    storedAs: "stored-filename.txt",
                    size: 1024,
                    mimeType: "text/plain",
                    userId: 1,
                },
            ]);
        });

        it("should return empty array when no files found", async () => {
            // Arrange
            mockFileInfoRepository.find.mockResolvedValue([]);

            // Act
            const result = await transfertService.getFilesByUserId(1, 0, 10);

            // Assert
            expect(result).toEqual([]);
        });

        it("should handle pagination correctly", async () => {
            // Arrange
            mockFileInfoRepository.find.mockResolvedValue([]);

            // Act
            await transfertService.getFilesByUserId(1, 5, 15);

            // Assert
            expect(mockFileInfoRepository.find).toHaveBeenCalledWith({
                where: { user: { id: 1 } },
                skip: 5,
                take: 15,
                relations: ["user"],
            });
        });
    });

    describe("getFileByIdByUser", () => {
        it("should return file metadata for authorized user", async () => {
            // Arrange
            mockFileInfoRepository.findOne.mockResolvedValue(testFileInfo);

            // Act
            const result = await transfertService.getFileByIdByUser(1, 1);

            // Assert
            expect(result).toEqual({
                id: 1,
                originalName: "test-file.txt",
                storedAs: "stored-filename.txt",
                size: 1024,
                mimeType: "text/plain",
                userId: 1,
            });
        });

        it("should throw AppError when user tries to access file they don't own", async () => {
            // Arrange
            mockFileInfoRepository.findOne.mockResolvedValue(testFileInfo);

            // Act & Assert
            await expect(
                transfertService.getFileByIdByUser(1, 2),
            ).rejects.toThrow(
                new AppError(
                    "You do not have the rights to view this file.",
                    403,
                ),
            );
        });

        it("should throw AppError when file does not exist", async () => {
            // Arrange
            mockFileInfoRepository.findOne.mockResolvedValue(null);

            // Act & Assert
            await expect(
                transfertService.getFileByIdByUser(1, 1),
            ).rejects.toThrow(new AppError("File is missing.", 404));
        });
    });

    describe("getFilePathByIdByUser", () => {
        it("should return file path for authorized user", async () => {
            // Arrange
            mockFileInfoRepository.findOne.mockResolvedValue(testFileInfo);

            // Act
            const result = await transfertService.getFilePathByIdByUser(1, 1);

            // Assert
            expect(result).toBe("/uploads/stored-filename.txt");
        });

        it("should throw AppError when user tries to access file they don't own", async () => {
            // Arrange
            mockFileInfoRepository.findOne.mockResolvedValue(testFileInfo);

            // Act & Assert
            await expect(
                transfertService.getFilePathByIdByUser(1, 2),
            ).rejects.toThrow(
                new AppError(
                    "You do not have the rights to download this file.",
                    403,
                ),
            );
        });
    });

    describe("getFileOriginalNameByIdByUser", () => {
        it("should return original file name for authorized user", async () => {
            // Arrange
            mockFileInfoRepository.findOne.mockResolvedValue(testFileInfo);

            // Act
            const result = await transfertService.getFileOriginalNameByIdByUser(
                1,
                1,
            );

            // Assert
            expect(result).toBe("test-file.txt");
        });

        it("should throw AppError when user tries to access file they don't own", async () => {
            // Arrange
            mockFileInfoRepository.findOne.mockResolvedValue(testFileInfo);

            // Act & Assert
            await expect(
                transfertService.getFileOriginalNameByIdByUser(1, 2),
            ).rejects.toThrow(
                new AppError(
                    "You do not have the rights to view this file.",
                    403,
                ),
            );
        });
    });

    describe("deleteFileByIdByUser", () => {
        it("should delete file for authorized user", async () => {
            // Arrange
            mockFileInfoRepository.findOne.mockResolvedValue(testFileInfo);
            mockFileInfoRepository.delete.mockResolvedValue({
                affected: 1,
            } as any);
            mockFs.rmSync.mockImplementation(() => {});

            // Act
            const result = await transfertService.deleteFileByIdByUser(1, 1);

            // Assert
            expect(mockFs.rmSync).toHaveBeenCalledWith(
                "/uploads/stored-filename.txt",
            );
            expect(mockFileInfoRepository.delete).toHaveBeenCalledWith(1);
            expect(result).toBe(true);
        });

        it("should throw AppError when user tries to delete file they don't own", async () => {
            // Arrange
            mockFileInfoRepository.findOne.mockResolvedValue(testFileInfo);

            // Act & Assert
            await expect(
                transfertService.deleteFileByIdByUser(1, 2),
            ).rejects.toThrow(
                new AppError(
                    "You do not have the rights to delete this file.",
                    403,
                ),
            );
        });

        it("should throw AppError when file does not exist", async () => {
            // Arrange
            mockFileInfoRepository.findOne.mockResolvedValue(null);

            // Act & Assert
            await expect(
                transfertService.deleteFileByIdByUser(1, 1),
            ).rejects.toThrow(new AppError("File is missing.", 404));
        });

        it("should handle fs errors gracefully", async () => {
            // Arrange
            mockFileInfoRepository.findOne.mockResolvedValue(testFileInfo);
            mockFs.rmSync.mockImplementation(() => {
                throw new Error("File system error");
            });

            // Act & Assert
            await expect(
                transfertService.deleteFileByIdByUser(1, 1),
            ).rejects.toThrow("File system error");
        });
    });
});
