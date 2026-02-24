import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { logger } from "../config/logger.js";
import { STATUS_CODES } from "http";

export class AppError extends Error {
    statusCode: number;
    status: string;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.status = STATUS_CODES[statusCode] || `${statusCode}`;
    }
}

/**
 * Handle error logging for the API. If the error is an instance of AppError,
 * return an HTTP response feature said error and its status code, otherwise use the status code 500.
 * @param err Caught error.
 * @param req Incoming request.
 * @param res Response for the incoming request.
 * @param next Next function.
 * @returns
 */
export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                statusCode: 413,
                status: "Payload Too Large",
                message: "File too large, limit is 5Mo",
            });
        }

        return res.status(400).json({
            statusCode: 400,
            status: "Bad Request",
            message: err.message,
        });
    }

    if (err instanceof AppError) {
        logger.error(
            `user id: ${req.user?.id || "anonymous"} - ${err.message}`,
        );
        return res.status(err.statusCode).json({
            statusCode: err.statusCode,
            status: err.status,
            message: err.message,
        });
    }

    logger.error(err.stack || err);
    return res.status(500).json({
        statusCode: 500,
        status: "Internal Server Error",
        message:
            process.env.NODE_ENV === "development" ||
            process.env.NODE_ENV === "test"
                ? err.message
                : "Internal Server Error",
    });
};
