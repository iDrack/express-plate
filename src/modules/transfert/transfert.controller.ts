import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../middlewares/errorHandler.js";
import { transfertService } from "./transfert.service.js";
import type { FileMetaData } from "./transfert.types.js";

export class TransfertController {
    constructor() {
        this.uploadMultipleFile = this.uploadMultipleFile.bind(this);
    }

    /**
     * Allow the transfert of multiples files.
     * @param req Incoming HTTP request.
     * @param res Response or the incoming HTTP request.
     * @param next Following function.
     */
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

    /**
     * Return the infos of every files owned by the authenticated user.
     * @param req Incoming HTTP request.
     * @param res Response or the incoming HTTP request.
     * @param next Following function.
     */
    async getAllFiles(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            if (req.user.id < 0) {
                throw new AppError("User id is invalid.", 405);
            }

            const result = await transfertService.getFilesByUserId(req.user.id);

            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Return the information of a file specified by it's id for the authenticated user.
     * @param req Incoming HTTP request.
     * @param res Response or the incoming HTTP request.
     * @param next Following function.
     */
    async getFileById(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            if (req.params.id === undefined) {
                throw new AppError("File id is missing.", 404);
            }
            if (parseInt(req.params?.id) < 0) {
                throw new AppError("File id is invalid.", 405);
            }

            if (req.user.id < 0) {
                throw new AppError("User id is invalid.", 405);
            }

            const result = await transfertService.getFileByIdByUser(
                parseInt(req.params.id),
                req.user.id,
            );

            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Return the information of a file specified by it's id for the authenticated user.
     * @param req Incoming HTTP request.
     * @param res Response or the incoming HTTP request.
     * @param next Following function.
     */
    async deleteFileById(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            if (req.params.id === undefined) {
                throw new AppError("File id is missing.", 404);
            }
            if (parseInt(req.params?.id) < 0) {
                throw new AppError("File id is invalid.", 405);
            }

            if (req.user.id < 0) {
                throw new AppError("User id is invalid.", 405);
            }

            const result = await transfertService.deleteFileByIdByUser(
                parseInt(req.params.id),
                req.user.id,
            );

            res.status(200).json({
                status: "success",
                data: `File with id ${req.params.id} has been deleted successfully.`,
            });
        } catch (error) {
            next(error);
        }
    }
}
