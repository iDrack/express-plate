import type { Repository } from "typeorm";
import { FileInfo } from "../../models/fileInfo.js";
import { AppDataSource } from "../../config/database.js";
import { UserService } from "../user/user.service.js";
import type { FileMetaData } from "./transfert.types.js";
import { AppError } from "../../middlewares/errorHandler.js";
import fs from "fs";
import { Service, Container } from "typedi";

@Service()
export class TransfertService {
    private fileInfoRepository: Repository<FileInfo>;
    private userService = Container.get(UserService);

    constructor() {
        this.fileInfoRepository = AppDataSource.getRepository(FileInfo);
    }

    /**
     * Get file info from the database.
     * @param fileId Id for the file being requested.
     * @returns Requested file if exists.
     */
    async getFileById(fileId: number): Promise<FileInfo> {
        const file = await this.fileInfoRepository.findOne({
            where: {
                id: fileId,
            },
            relations: ["user"],
        });

        if (file === null || file === undefined) {
            throw new AppError("File is missing.", 404);
        }

        return file;
    }

    /**
     * Count number of files.
     * @returns NUmber of files.
     */
    async countNbFiles(): Promise<number> {
        return await this.fileInfoRepository.count();
    }

    /**
     * Save a copy of the metadata and its owner of a file being transferred.
     * @param file Multer file being transferred.
     * @param userId Id of the user owning the file.
     * @returns Sanitized metadata of the transferred file.
     */
    async uploadFile(
        file: Express.Multer.File,
        userId: number,
    ): Promise<FileMetaData> {
        const user = await this.userService.getUserById(userId);
        const decodedOriginalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const fileMeta = {
            originalName: decodedOriginalName,
            storedAs: file.filename,
            path: file.path,
            size: file.size,
            mimeType: file.mimetype,
        };

        const fileInfo = this.fileInfoRepository.create({
            originalName: fileMeta.originalName,
            storedAs: fileMeta.storedAs,
            path: fileMeta.path,
            size: fileMeta.size,
            mimeType: fileMeta.mimeType,
            user: user,
        });

        await this.fileInfoRepository.save(fileInfo);

        return {
            id: fileInfo.id,
            originalName: fileMeta.originalName,
            storedAs: fileMeta.storedAs,
            size: fileMeta.size,
            mimeType: fileMeta.mimeType,
            userId: userId,
        };
    }

    /**
     * Retrieve every file metadata owned by a specific user.
     * @param userId User id.
     * @param offset NUmber of files to skip over.
     * @param limit Limit of files to return.
     * @returns Array of sanitized metadata of files.
     */
    async getFilesByUserId(
        userId: number,
        offset: number,
        limit: number,
    ): Promise<Array<FileMetaData>> {
        const filesInfo = await this.fileInfoRepository.find({
            where: {
                user: {
                    id: userId,
                },
            },
            skip: offset,
            take: limit,
            relations: ["user"],
        });

        if (filesInfo.length === 0) {
            return [];
        }

        const filesMeta: Array<FileMetaData> = [];
        filesInfo.map((file) => {
            filesMeta.push({
                id: file.id,
                originalName: file.originalName,
                storedAs: file.storedAs,
                size: file.size,
                mimeType: file.mimeType,
                userId: file.user.id,
            });
        });
        return filesMeta;
    }

    /**
     * Retrieve the metadata of a specified file (by its Id).
     * @param fileId Id of the file being requested.
     * @param userId Id of the file owner.
     * @returns Sanitized metadata of a requested file.
     */
    async getFileByIdByUser(
        fileId: number,
        userId: number,
    ): Promise<FileMetaData> {
        try {
            const file = await this.getFileById(fileId);

            if (file.user.id !== userId) {
                throw new AppError(
                    "You do not have the rights to view this file.",
                    403,
                );
            }
            const fileMeta = {
                id: file.id,
                originalName: file.originalName,
                storedAs: file.storedAs,
                size: file.size,
                mimeType: file.mimeType,
                userId: file.user.id,
            };

            return fileMeta;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get the path for a requested file for a user.
     * @param fileId Id of the file being requested.
     * @param userId Id of the file owner.
     * @returns Absolute path for the requested file.
     */
    async getFilePathByIdByUser(
        fileId: number,
        userId: number,
    ): Promise<string> {
        const file = await this.getFileById(fileId);

        if (file.user.id !== userId) {
            throw new AppError(
                "You do not have the rights to download this file.",
                403,
            );
        }

        return file.path;
    }

    /**
     * Get the original name for a requested file for a user.
     * @param fileId Id of the file being requested.
     * @param userId Id of the file owner.
     * @returns Original name for the requested file.
     */
    async getFileOriginalNameByIdByUser(
        fileId: number,
        userId: number,
    ): Promise<string> {
        const file = await this.getFileById(fileId);

        if (file.user.id !== userId) {
            throw new AppError(
                "You do not have the rights to view this file.",
                403,
            );
        }

        return file.originalName;
    }

    /**
     * Delete a file and its info from the db.
     * @param fileId Id of the file being requested.
     * @param userId Id of the file owner.
     * @returns True if file is deleted.
     */
    async deleteFileByIdByUser(
        fileId: number,
        userId: number,
    ): Promise<string> {
        try {
            const file = await this.getFileById(fileId);

            if (file.user.id !== userId) {
                throw new AppError(
                    "You do not have the rights to delete this file.",
                    403,
                );
            }
            fs.rmSync(file.path);

            await this.fileInfoRepository.delete(fileId);

            return file.originalName;
        } catch (error) {
            throw error;
        }
    }
}
