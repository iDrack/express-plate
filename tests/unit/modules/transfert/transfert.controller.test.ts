// Mock bcrypt before other imports
jest.mock("bcrypt", () => ({
    hash: jest.fn((data: string) => Promise.resolve(`hashed_${data}`)),
    hashSync: jest.fn((data: string) => `hashed_${data}`),
    compare: jest.fn((data: string, encrypted: string) =>
        Promise.resolve(data === encrypted.replace("hashed_", "")),
    ),
    compareSync: jest.fn(
        (data: string, encrypted: string) =>
            data === encrypted.replace("hashed_", ""),
    ),
    genSalt: jest.fn(() => Promise.resolve("salt")),
    genSaltSync: jest.fn(() => "salt"),
}));

import { TransfertController } from "../../../../src/modules/transfert/transfert.controller.js";
import { TransfertService } from "../../../../src/modules/transfert/transfert.service.js";
import { AppError } from "../../../../src/middlewares/errorHandler.js";
import path from "path";
import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../../../../src/middlewares/authMiddleware.js";
import { MockContainer } from "../../../utils/mockContainer";


jest.mock("path");

const mockPath = path as jest.Mocked<typeof path>;

describe("TransfertController", () => {
    let controller: TransfertController;
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.MockedFunction<NextFunction>;
    let mockTransfertService: jest.Mocked<TransfertService>;

    beforeEach(() => {
        mockTransfertService =
            MockContainer.createMockService<TransfertService>(TransfertService);

        controller = new TransfertController();
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            sendFile: jest.fn(),
            download: jest.fn(),
        };
        mockNext = jest.fn();
        MockContainer.reset();
    });

    describe("constructor", () => {
        it("should initialize with default limit", () => {
            expect(controller.limit).toBe(20);
        });

        it("should bind methods correctly", () => {
            expect(controller.uploadMultipleFile).toBeDefined();
            expect(controller.deleteFileById).toBeDefined();
            expect(controller.getAllFiles).toBeDefined();
        });
    });

    describe("uploadMultipleFile", () => {
        it("should upload multiple files successfully", async () => {
            const mockFiles = [
                { originalname: "test1.jpg" },
                { originalname: "test2.pdf" },
            ] as Express.Multer.File[];
            const mockUser = { id: 1, name: "user", role: "user" };
            const mockFileMetaData = [
                { id: 1, originalname: "test1.jpg" },
                { id: 2, originalname: "test2.pdf" },
            ];

            mockRequest.files = mockFiles;
            mockRequest.user = mockUser;
            mockTransfertService.uploadFile.mockResolvedValueOnce(
                mockFileMetaData[0] as any,
            );
            mockTransfertService.uploadFile.mockResolvedValueOnce(
                mockFileMetaData[1] as any,
            );

            await controller.uploadMultipleFile(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(mockTransfertService.uploadFile).toHaveBeenCalledTimes(2);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "success",
                data: {
                    files: {
                        "1": mockFileMetaData[0],
                        "2": mockFileMetaData[1],
                    },
                },
            });
        });

        it("should throw error when user is not authenticated", async () => {
            mockRequest.files = [];
            mockRequest.user = undefined;

            await controller.uploadMultipleFile(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "You need to be logged in to upload a file.",
                    statusCode: 401,
                }),
            );
        });

        it("should throw error when no files are provided", async () => {
            mockRequest.files = [];
            mockRequest.user = { id: 1, name: "user", role: "user" };

            await controller.uploadMultipleFile(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "No file received.",
                    statusCode: 404,
                }),
            );
        });
    });

    describe("getAllFiles", () => {
        it("should get all files with pagination", async () => {
            const mockUser = { id: 1, name: "user", role: "user" };
            const mockFiles = [
                { id: 1, originalname: "test1.jpg" },
                { id: 2, originalname: "test2.pdf" },
            ];

            mockRequest.user = mockUser;
            mockRequest.query = { page: "1" };
            mockTransfertService.countNbFiles.mockResolvedValue(2);
            mockTransfertService.getFilesByUserId.mockResolvedValue(
                mockFiles as any,
            );

            await controller.getAllFiles(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(mockTransfertService.getFilesByUserId).toHaveBeenCalledWith(
                1,
                0,
                20,
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "success",
                data: mockFiles,
                page: 1,
                totalPages: 1,
                limit: 20,
                totalItems: 2,
                totalFiles: 2,
                prevPage: null,
                nextPage: null,
            });
        });

        it("should handle invalid user id", async () => {
            mockRequest.user = { id: -1, name: "user", role: "user" };
            mockRequest.query = { page: "1" };

            await controller.getAllFiles(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "User id is invalid.",
                    statusCode: 405,
                }),
            );
        });

        it("should handle page number greater than total pages", async () => {
            const mockUser = { id: 1, name: "user", role: "user" };
            mockRequest.user = mockUser;
            mockRequest.query = { page: "10" };
            mockTransfertService.countNbFiles.mockResolvedValue(20);
            mockTransfertService.getFilesByUserId.mockResolvedValue([]);

            await controller.getAllFiles(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(mockTransfertService.getFilesByUserId).toHaveBeenCalledWith(
                1,
                0,
                20,
            );
        });
    });

    describe("getFileById", () => {
        it("should get file by id successfully", async () => {
            const mockUser = { id: 1, name: "user", role: "user" };
            const mockFile = { id: 1, originalname: "test.jpg" };

            mockRequest.user = mockUser;
            mockRequest.params = { id: "1" };
            mockTransfertService.getFileByIdByUser.mockResolvedValue(
                mockFile as any,
            );

            await controller.getFileById(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(mockTransfertService.getFileByIdByUser).toHaveBeenCalledWith(
                1,
                1,
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "success",
                data: mockFile,
            });
        });

        it("should throw error when file id is missing", async () => {
            mockRequest.user = { id: 1, name: "user", role: "user" };
            mockRequest.params = {};

            await controller.getFileById(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "File id is missing.",
                    statusCode: 404,
                }),
            );
        });

        it("should throw error when file id is invalid", async () => {
            mockRequest.user = { id: 1, name: "user", role: "user" };
            mockRequest.params = { id: "-1" };

            await controller.getFileById(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "File id is invalid.",
                    statusCode: 405,
                }),
            );
        });
    });

    describe("StreamFileById", () => {
        it("should stream file successfully", async () => {
            const mockUser = { id: 1, name: "user", role: "user" };
            const mockFilePath = "/path/to/file.jpg";
            const mockResolvedPath = "/absolute/path/to/file.jpg";

            mockRequest.user = mockUser;
            mockRequest.params = { id: "1" };
            mockTransfertService.getFilePathByIdByUser.mockResolvedValue(
                mockFilePath,
            );
            mockPath.resolve.mockReturnValue(mockResolvedPath);

            await controller.StreamFileById(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(
                mockTransfertService.getFilePathByIdByUser,
            ).toHaveBeenCalledWith(1, 1);
            expect(mockPath.resolve).toHaveBeenCalledWith(mockFilePath);
            expect(mockResponse.sendFile).toHaveBeenCalledWith(
                mockResolvedPath,
                {
                    headers: {
                        "Cache-Control": "private, max-age=3600",
                    },
                },
            );
        });
    });

    describe("DownloadFileById", () => {
        it("should download file successfully", async () => {
            const mockUser = { id: 1, name: "user", role: "user" };
            const mockFilePath = "/path/to/file.jpg";
            const mockResolvedPath = "/absolute/path/to/file.jpg";
            const mockOriginalName = "original_file.jpg";

            mockRequest.user = mockUser;
            mockRequest.params = { id: "1" };
            mockTransfertService.getFilePathByIdByUser.mockResolvedValue(
                mockFilePath,
            );
            mockTransfertService.getFileOriginalNameByIdByUser.mockResolvedValue(
                mockOriginalName,
            );
            mockPath.resolve.mockReturnValue(mockResolvedPath);

            await controller.DownloadFileById(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(
                mockTransfertService.getFilePathByIdByUser,
            ).toHaveBeenCalledWith(1, 1);
            expect(
                mockTransfertService.getFileOriginalNameByIdByUser,
            ).toHaveBeenCalledWith(1, 1);
            expect(mockPath.resolve).toHaveBeenCalledWith(mockFilePath);
            expect(mockResponse.download).toHaveBeenCalledWith(
                mockResolvedPath,
                mockOriginalName,
                {
                    headers: {
                        "Cache-Control": "private, max-age=3600",
                    },
                },
            );
        });
    });

    describe("deleteFileById", () => {
        it("should delete file successfully", async () => {
            const mockUser = { id: 1, name: "user", role: "user" };

            mockRequest.user = mockUser;
            mockRequest.params = { id: "1" };
            mockTransfertService.deleteFileByIdByUser.mockResolvedValue(false);

            await controller.deleteFileById(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(
                mockTransfertService.deleteFileByIdByUser,
            ).toHaveBeenCalledWith(1, 1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "success",
                data: "File with id 1 has been deleted successfully.",
            });
        });
    });

    describe("getTotalPages", () => {
        it("should calculate total pages correctly", async () => {
            mockTransfertService.countNbFiles.mockResolvedValue(45);

            const totalPages = await (controller as any).getTotalPages();

            expect(totalPages).toBe(3); // 45 / 20 = 2.25 => Math.ceil = 3
        });

        it("should handle zero files", async () => {
            mockTransfertService.countNbFiles.mockResolvedValue(0);

            const totalPages = await (controller as any).getTotalPages();

            expect(totalPages).toBe(0);
        });
    });

    describe("getPageMetaData", () => {
        it("should create correct metadata", async () => {
            const mockResult = [{ id: 1 }, { id: 2 }] as any;
            mockTransfertService.countNbFiles.mockResolvedValue(25);

            const metadata = await (controller as any).getPageMetaData(
                mockResult,
                2,
            );

            expect(metadata).toEqual({
                page: 2,
                totalPages: 2,
                limit: 20,
                totalItems: 2,
                totalFiles: 25,
                prevPage: 1,
                nextPage: null,
            });
        });

        it("should handle first page", async () => {
            const mockResult = [{ id: 1 }] as any;
            mockTransfertService.countNbFiles.mockResolvedValue(25);

            const metadata = await (controller as any).getPageMetaData(
                mockResult,
                1,
            );

            expect(metadata.prevPage).toBeNull();
            expect(metadata.nextPage).toBe(2);
        });
    });
});
