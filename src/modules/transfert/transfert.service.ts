import type { Repository } from "typeorm";
import { FileInfo } from "../../models/fileInfo.js";
import { AppDataSource } from "../../config/database.js";
import { userService } from "../user/user.service.js";
import type { FileMetaData } from "./transfert.types.js";

class TransfertService {
    private fileInfoRepository: Repository<FileInfo>;
    private static instance: TransfertService;

    static getInstance() {
        if (!TransfertService.instance) {
            TransfertService.instance = new TransfertService();
        }
        return TransfertService.instance;
    }

    private constructor() {
        this.fileInfoRepository = AppDataSource.getRepository(FileInfo);
    }

    async uploadFile(
        file: Express.Multer.File,
        userId: number,
    ): Promise<FileMetaData> {
        const user = await userService.getUserById(userId);
        const fileMeta = {
            originalName: file.originalname,
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
        }
    }
}

export const transfertService = TransfertService.getInstance();
