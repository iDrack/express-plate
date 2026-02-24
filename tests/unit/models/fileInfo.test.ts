import { describe, it, expect, beforeEach } from "@jest/globals";
import { FileInfo } from "../../../src/models/fileInfo";
import { User } from "../../../src/models/user";

describe("FileInfo class", () => {
    let fileInfo: FileInfo;
    let user: User;

    beforeEach(() => {
        fileInfo = new FileInfo();
        user = new User();
    });

    describe("Instance creation", () => {
        it("should create a FileInfo instance", () => {
            expect(fileInfo).toBeInstanceOf(FileInfo);
        });

        it("should have undefined properties by default", () => {
            expect(fileInfo.id).toBeUndefined();
            expect(fileInfo.originalName).toBeUndefined();
            expect(fileInfo.path).toBeUndefined();
            expect(fileInfo.storedAs).toBeUndefined();
            expect(fileInfo.size).toBeUndefined();
            expect(fileInfo.mimeType).toBeUndefined();
            expect(fileInfo.user).toBeUndefined();
            expect(fileInfo.createdAt).toBeUndefined();
            expect(fileInfo.updatedAt).toBeUndefined();
        });
    });

    describe("Property assignment and retrieval", () => {
        it("should set and get id property", () => {
            fileInfo.id = 1;
            expect(fileInfo.id).toBe(1);
        });

        it("should set and get originalName property", () => {
            const originalName = "test-document.pdf";
            fileInfo.originalName = originalName;
            expect(fileInfo.originalName).toBe(originalName);
        });

        it("should set and get path property", () => {
            const path = "/uploads/documents/test-file.pdf";
            fileInfo.path = path;
            expect(fileInfo.path).toBe(path);
        });

        it("should set and get storedAs property", () => {
            const storedAs = "abc123-def456-ghi789.pdf";
            fileInfo.storedAs = storedAs;
            expect(fileInfo.storedAs).toBe(storedAs);
        });

        it("should set and get size property", () => {
            const size = 1024567;
            fileInfo.size = size;
            expect(fileInfo.size).toBe(size);
        });

        it("should set and get mimeType property", () => {
            const mimeType = "application/pdf";
            fileInfo.mimeType = mimeType;
            expect(fileInfo.mimeType).toBe(mimeType);
        });

        it("should set and get user property", () => {
            user.id = 1;
            user.email = "test@example.com";
            fileInfo.user = user;
            expect(fileInfo.user).toBe(user);
            expect(fileInfo.user.id).toBe(1);
            expect(fileInfo.user.email).toBe("test@example.com");
        });

        it("should set and get createdAt property", () => {
            const date = new Date();
            fileInfo.createdAt = date;
            expect(fileInfo.createdAt).toBe(date);
        });

        it("should set and get updatedAt property", () => {
            const date = new Date();
            fileInfo.updatedAt = date;
            expect(fileInfo.updatedAt).toBe(date);
        });
    });

    describe("File information handling", () => {
        it("should handle complete file information", () => {
            const testData = {
                id: 1,
                originalName: "my-presentation.pptx",
                path: "/uploads/presentations/2024/my-presentation.pptx",
                storedAs: "uuid-generated-filename.pptx",
                size: 2048000,
                mimeType:
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                createdAt: new Date("2024-01-01T10:00:00Z"),
                updatedAt: new Date("2024-01-01T10:00:00Z"),
            };

            Object.assign(fileInfo, testData);

            expect(fileInfo.id).toBe(testData.id);
            expect(fileInfo.originalName).toBe(testData.originalName);
            expect(fileInfo.path).toBe(testData.path);
            expect(fileInfo.storedAs).toBe(testData.storedAs);
            expect(fileInfo.size).toBe(testData.size);
            expect(fileInfo.mimeType).toBe(testData.mimeType);
            expect(fileInfo.createdAt).toBe(testData.createdAt);
            expect(fileInfo.updatedAt).toBe(testData.updatedAt);
        });

        it("should handle different file types correctly", () => {
            const imageFile = new FileInfo();
            imageFile.originalName = "photo.jpg";
            imageFile.mimeType = "image/jpeg";
            imageFile.size = 500000;

            const textFile = new FileInfo();
            textFile.originalName = "document.txt";
            textFile.mimeType = "text/plain";
            textFile.size = 1024;

            expect(imageFile.originalName).toBe("photo.jpg");
            expect(imageFile.mimeType).toBe("image/jpeg");
            expect(imageFile.size).toBe(500000);

            expect(textFile.originalName).toBe("document.txt");
            expect(textFile.mimeType).toBe("text/plain");
            expect(textFile.size).toBe(1024);
        });
    });

    describe("User relationship", () => {
        it("should establish relationship with User", () => {
            const testUser = new User();
            testUser.id = 42;
            testUser.email = "owner@example.com";
            testUser.name = "File Owner";

            fileInfo.user = testUser;

            expect(fileInfo.user).toBeInstanceOf(User);
            expect(fileInfo.user.id).toBe(42);
            expect(fileInfo.user.email).toBe("owner@example.com");
            expect(fileInfo.user.name).toBe("File Owner");
        });

        it("should allow changing user relationship", () => {
            const firstUser = new User();
            firstUser.id = 1;
            firstUser.email = "user1@example.com";

            const secondUser = new User();
            secondUser.id = 2;
            secondUser.email = "user2@example.com";

            fileInfo.user = firstUser;
            expect(fileInfo.user.id).toBe(1);

            fileInfo.user = secondUser;
            expect(fileInfo.user.id).toBe(2);
            expect(fileInfo.user.email).toBe("user2@example.com");
        });
    });

    describe("Date handling", () => {
        it("should handle createdAt and updatedAt timestamps", () => {
            const createdDate = new Date("2024-01-01T10:00:00Z");
            const updatedDate = new Date("2024-01-02T15:30:00Z");

            fileInfo.createdAt = createdDate;
            fileInfo.updatedAt = updatedDate;

            expect(fileInfo.createdAt).toEqual(createdDate);
            expect(fileInfo.updatedAt).toEqual(updatedDate);
            expect(fileInfo.updatedAt.getTime()).toBeGreaterThan(
                fileInfo.createdAt.getTime(),
            );
        });

        it("should handle current date assignment", () => {
            const now = new Date();
            fileInfo.createdAt = now;
            fileInfo.updatedAt = now;

            expect(fileInfo.createdAt).toBe(now);
            expect(fileInfo.updatedAt).toBe(now);
        });
    });

    describe("Size handling", () => {
        it("should handle various file sizes", () => {
            const testSizes = [
                0, // Empty file
                1, // 1 byte
                1024, // 1 KB
                1048576, // 1 MB
                1073741824, // 1 GB
            ];

            testSizes.forEach((size) => {
                const testFile = new FileInfo();
                testFile.size = size;
                expect(testFile.size).toBe(size);
            });
        });
    });

    describe("MIME type handling", () => {
        it("should handle common MIME types", () => {
            const mimeTypes = [
                "text/plain",
                "text/html",
                "image/jpeg",
                "image/png",
                "application/pdf",
                "application/json",
                "video/mp4",
                "audio/mpeg",
            ];

            mimeTypes.forEach((mimeType) => {
                const testFile = new FileInfo();
                testFile.mimeType = mimeType;
                expect(testFile.mimeType).toBe(mimeType);
            });
        });
    });

    describe("Path and storage name handling", () => {
        it("should handle file paths correctly", () => {
            const paths = [
                "/uploads/file.txt",
                "/home/user/documents/important.pdf",
                "C:\\Users\\User\\Documents\\file.docx",
                "./relative/path/file.jpg",
            ];

            paths.forEach((path) => {
                const testFile = new FileInfo();
                testFile.path = path;
                expect(testFile.path).toBe(path);
            });
        });

        it("should handle stored names correctly", () => {
            const storedNames = [
                "abc-123-def.txt",
                "uuid-v4-generated-name.pdf",
                "timestamp-1642781234567.jpg",
                "hash-md5-abcdef123456.docx",
            ];

            storedNames.forEach((storedName) => {
                const testFile = new FileInfo();
                testFile.storedAs = storedName;
                expect(testFile.storedAs).toBe(storedName);
            });
        });
    });
});
