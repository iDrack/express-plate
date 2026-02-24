import fs from "fs";
import path from "path";
import { ensureDir } from "../../../../src/modules/core/fs.utils";

jest.mock("fs");
const mockedFs = fs as jest.Mocked<typeof fs>;

describe("ensureDir", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return absolute path when directory already exists", () => {
        const dirPath = "existing-dir";
        const expectedAbsolute = path.resolve(dirPath);
        
        mockedFs.existsSync.mockReturnValue(true);
        
        const result = ensureDir(dirPath);
        
        expect(mockedFs.existsSync).toHaveBeenCalledWith(expectedAbsolute);
        expect(mockedFs.mkdirSync).not.toHaveBeenCalled();
        expect(result).toBe(expectedAbsolute);
    });

    it("should create directory and return absolute path when directory does not exist", () => {
        const dirPath = "new-dir";
        const expectedAbsolute = path.resolve(dirPath);
        
        mockedFs.existsSync.mockReturnValue(false);
        
        const result = ensureDir(dirPath);
        
        expect(mockedFs.existsSync).toHaveBeenCalledWith(expectedAbsolute);
        expect(mockedFs.mkdirSync).toHaveBeenCalledWith(expectedAbsolute, { recursive: true });
        expect(result).toBe(expectedAbsolute);
    });

    it("should handle relative paths correctly", () => {
        const dirPath = "./relative/path";
        const expectedAbsolute = path.resolve(dirPath);
        
        mockedFs.existsSync.mockReturnValue(false);
        
        const result = ensureDir(dirPath);
        
        expect(mockedFs.existsSync).toHaveBeenCalledWith(expectedAbsolute);
        expect(mockedFs.mkdirSync).toHaveBeenCalledWith(expectedAbsolute, { recursive: true });
        expect(result).toBe(expectedAbsolute);
    });

    it("should create nested directories recursively", () => {
        const dirPath = "deep/nested/directory/structure";
        const expectedAbsolute = path.resolve(dirPath);
        
        mockedFs.existsSync.mockReturnValue(false);
        
        const result = ensureDir(dirPath);
        
        expect(mockedFs.existsSync).toHaveBeenCalledWith(expectedAbsolute);
        expect(mockedFs.mkdirSync).toHaveBeenCalledWith(expectedAbsolute, { recursive: true });
        expect(result).toBe(expectedAbsolute);
    });

    it("should handle absolute paths correctly", () => {
        const dirPath = "/absolute/path/to/dir";
        const expectedAbsolute = path.resolve(dirPath);
        
        mockedFs.existsSync.mockReturnValue(true);
        
        const result = ensureDir(dirPath);
        
        expect(mockedFs.existsSync).toHaveBeenCalledWith(expectedAbsolute);
        expect(result).toBe(expectedAbsolute);
    });
});