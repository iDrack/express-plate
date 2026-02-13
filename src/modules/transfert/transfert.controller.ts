import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../middlewares/errorHandler.js";
import { transfertService } from "./transfert.service.js";
import type { FileInfo } from "../../models/fileInfo.js";
import type { FileMetaData } from "./transfert.types.js";

export class TransfertController {
    constructor() {
        this.uploadMultipleFile = this.uploadMultipleFile.bind(this);
    }
    
    async uploadMultipleFile(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const files = (req.files as Express.Multer.File[]) || [];
            if (!req.user) {
                throw new AppError(
                    "You need to be logged in to upload a file.",
                    401,
                );
            }
            if (files.length === 0) {
                throw new AppError("No file received.", 404);
            }

            const filesInfos: Array<FileMetaData> = await Promise.all(
                files.map((file) =>
                    transfertService.uploadFile(file, req.user.id),
                ),
            );
            const filesById = filesInfos.reduce<Record<string, FileMetaData>>(
                (acc, fileInfo) => {
                    acc[String(fileInfo.id)] = fileInfo;
                    return acc;
                },
                {},
            );
            res.status(200).json({
                status: "success",
                data: {
                    files: filesById,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
