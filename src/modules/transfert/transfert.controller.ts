import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../middlewares/errorHandler.js";
import { TransfertService } from "./transfert.service.js";
import type { FileMetaData, FilePageMetaData } from "./transfert.types.js";
import path from "path";
import { Container } from "typedi";

export class TransfertController {
    limit: number;
    private transfertService = Container.get(TransfertService);

    constructor() {
        this.limit = 20;
        this.uploadMultipleFile = this.uploadMultipleFile.bind(this);
        this.deleteFileById = this.deleteFileById.bind(this);
        this.getAllFiles = this.getAllFiles.bind(this);
        this.getFileById = this.getFileById.bind(this);
        this.getPageMetaData = this.getPageMetaData.bind(this);
        this.DownloadFileById = this.DownloadFileById.bind(this);
        this.StreamFileById = this.StreamFileById.bind(this);
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
                    this.transfertService.uploadFile(file, req.user.id),
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
     * Calculate the number of total pages in the FileInfo repository.
     * @returns Number of total pages.
     */
    private async getTotalPages(): Promise<number> {
        const totalNbFile = await this.transfertService.countNbFiles();
        return Math.ceil(totalNbFile / this.limit);
    }

    /**
     * Create the metadata for FileInfo.
     * @param result Query result.
     * @param page Page number requested.
     * @returns FileMetaData to add to the result of a request.
     */
    private async getPageMetaData(
        result: Array<FileMetaData>,
        page: number,
    ): Promise<FilePageMetaData> {
        const totalNbFile = await this.transfertService.countNbFiles();
        const totalPages = await this.getTotalPages();

        return {
            page: page,
            totalPages: totalPages,
            limit: this.limit,
            totalItems: result.length,
            totalFiles: totalNbFile,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: page < totalPages ? page + 1 : null,
        };
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

            let page = parseInt(String(req.query.page || 1));
            if (page > (await this.getTotalPages())) {
                page = await this.getTotalPages();
            } else if (page <= 0) {
                page = 1;
            }
            const offset = (page - 1) * this.limit;

            const result = await this.transfertService.getFilesByUserId(
                req.user.id,
                offset,
                this.limit,
            );

            const metadata = await this.getPageMetaData(result, page);

            res.status(200).json({
                status: "success",
                data: result,
                ...metadata,
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

            const result = await this.transfertService.getFileByIdByUser(
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
     * Send a file by its id, the authenticated user must own said file. Cache is set for 1h.
     * @param req Incoming HTTP request.
     * @param res Response or the incoming HTTP request.
     * @param next Following function.
     */
    async StreamFileById(
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

            const filePath = await this.transfertService.getFilePathByIdByUser(
                parseInt(req.params.id),
                req.user.id,
            );
            const file = path.resolve(filePath);

            res.sendFile(file, {
                headers: {
                    "Cache-Control": "private, max-age=3600",
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Download a file by its id, the authenticated user must own said file. Cache is set for 1h.
     * @param req Incoming HTTP request.
     * @param res Response or the incoming HTTP request.
     * @param next Following function.
     */
    async DownloadFileById(
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

            const { fileId, userId } = {
                fileId: parseInt(req.params.id),
                userId: req.user.id,
            };

            const filePath = await this.transfertService.getFilePathByIdByUser(
                fileId,
                userId,
            );
            const file = path.resolve(filePath);
            const originalName =
                await this.transfertService.getFileOriginalNameByIdByUser(
                    fileId,
                    userId,
                );

            res.download(file, originalName, {
                headers: {
                    "Cache-Control": "private, max-age=3600",
                },
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

            const result = await this.transfertService.deleteFileByIdByUser(
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
