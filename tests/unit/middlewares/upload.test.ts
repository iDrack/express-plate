import multer from "multer";
import path from "path";
import { AppError } from "../../../src/middlewares/errorHandler.js";
import { ensureDir } from "../../../src/modules/core/fs.utils.js";

jest.mock("multer");
jest.mock("../../../src/modules/core/fs.utils.js");

const mockEnsureDir = ensureDir as jest.MockedFunction<typeof ensureDir>;
const mockMulter = multer as jest.MockedFunction<typeof multer>;
const mockDiskStorage = multer.diskStorage as jest.MockedFunction<typeof multer.diskStorage>;

describe("Upload Middleware", () => {
    let storageConfig: any;
    let multerConfig: any;

    beforeAll(() => {
        // Mock multer.diskStorage to capture the storage configuration
        mockDiskStorage.mockImplementation((config) => {
            storageConfig = config;
            return {} as any;
        });

        // Mock multer to capture the multer configuration
        mockMulter.mockImplementation((config) => {
            multerConfig = config;
            return {} as any;
        });

        // Import the upload module after setting up mocks
        require("../../../src/middlewares/upload.js");
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock crypto.randomUUID
        Object.defineProperty(global, "crypto", {
            value: { randomUUID: jest.fn(() => "123e4567-e89b-12d3-a456-426614174000") },
            configurable: true
        });
    });

    describe("storage destination", () => {
        it("should create user directory when user is authenticated", () => {
            const mockReq = {
                user: { id: 123 }
            };
            const mockFile = {};
            const mockCb = jest.fn();
            const expectedPath = "/absolute/path/bucket/123";

            mockEnsureDir.mockReturnValue(expectedPath);

            storageConfig.destination(mockReq, mockFile, mockCb);

            expect(mockEnsureDir).toHaveBeenCalledWith(path.join("bucket", "123"));
            expect(mockCb).toHaveBeenCalledWith(null, expectedPath);
        });

        it("should call callback with error when user is not authenticated", () => {
            const mockReq = {};
            const mockFile = {};
            const mockCb = jest.fn();

            storageConfig.destination(mockReq, mockFile, mockCb);

            expect(mockCb).toHaveBeenCalledWith(
                expect.any(AppError),
                ""
            );
            expect(mockCb.mock.calls[0][0].message).toBe("User is not authenticated.");
            expect(mockCb.mock.calls[0][0].statusCode).toBe(401);
        });

        it("should handle user without id", () => {
            const mockReq = {
                user: {}
            };
            const mockFile = {};
            const mockCb = jest.fn();

            storageConfig.destination(mockReq, mockFile, mockCb);

            expect(mockCb).toHaveBeenCalledWith(
                expect.any(AppError),
                ""
            );
        });
    });

    describe("storage filename", () => {
        it("should generate UUID filename with original extension", () => {
            const mockReq = {};
            const mockFile = { originalname: "test.jpg" };
            const mockCb = jest.fn();
            const mockUUID = "123e4567-e89b-12d3-a456-426614174000";

            storageConfig.filename(mockReq, mockFile, mockCb);

            expect(mockCb).toHaveBeenCalledWith(null, `${mockUUID}.jpg`);
        });

        it("should handle file without extension", () => {
            const mockReq = {};
            const mockFile = { originalname: "test" };
            const mockCb = jest.fn();
            const mockUUID = "123e4567-e89b-12d3-a456-426614174000";

            storageConfig.filename(mockReq, mockFile, mockCb);

            expect(mockCb).toHaveBeenCalledWith(null, `${mockUUID}`);
        });

        it("should handle complex filename", () => {
            const mockReq = {};
            const mockFile = { originalname: "my.complex.file.name.pdf" };
            const mockCb = jest.fn();
            const mockUUID = "123e4567-e89b-12d3-a456-426614174000";

            storageConfig.filename(mockReq, mockFile, mockCb);

            expect(mockCb).toHaveBeenCalledWith(null, `${mockUUID}.pdf`);
        });
    });

    describe("fileFilter", () => {
        it("should accept all files when allowed array is empty", () => {
            const mockReq = {};
            const mockFile = { mimetype: "image/jpeg" };
            const mockCb = jest.fn();

            multerConfig.fileFilter(mockReq, mockFile, mockCb);

            expect(mockCb).toHaveBeenCalledWith(null, true);
        });

        it("should accept any file type when allowed is empty", () => {
            const mockReq = {};
            const mockFile = { mimetype: "application/pdf" };
            const mockCb = jest.fn();

            multerConfig.fileFilter(mockReq, mockFile, mockCb);

            expect(mockCb).toHaveBeenCalledWith(null, true);
        });
    });

    describe("multer configuration", () => {
        it("should have correct file size limit", () => {
            expect(multerConfig.limits.fileSize).toBe(5 * 1024 * 1024);
        });

        it("should have storage and fileFilter configured", () => {
            expect(multerConfig.storage).toBeDefined();
            expect(multerConfig.fileFilter).toBeDefined();
        });
    });
});