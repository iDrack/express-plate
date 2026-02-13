import multer, { type FileFilterCallback } from "multer";
import path from "path";
import { AppError } from "./errorHandler.js";
import type { Request, RequestHandler } from "express";
import type { AuthRequest } from "./authMiddleware.js";
import { ensureDir } from "../modules/core/fs.utils.js";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const authRequest = req as AuthRequest;

        if (!authRequest.user?.id) {
            return cb(new AppError("User is not authenticated.", 401), "");
        }

        const userDir = path.join("bucket", String(authRequest.user.id));
        const absPath = ensureDir(userDir);

        cb(null, absPath);
    },
    filename: (req, file, cb) => {
        const fileExt = file.originalname.split(".").at(-1)
        //Generate random unique name for file, original name is sanitized and saved in db
        const id = crypto.randomUUID()
        cb(null, `${id}.${fileExt}`);
    },
});

function fileFilter(
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
) {
    let allowed: string[] = []; //Contains an array with the file type accepted by the API.
    //ex : allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowed.length > 0) {
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(null, false);
            throw new AppError(
                `File type: ${file.mimetype} is not supported.`,
                405,
            );
        }
    } else {
        cb(null, true);
    }
}

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});
