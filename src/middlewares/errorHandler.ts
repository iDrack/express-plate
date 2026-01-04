import type { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger.js";

export class AppError extends Error {
    statusCode: number;
    status: string;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`;
    }
}

/**
 * Handle error logging for the API. If the passed error is an instance of AppError, 
 * return a HTTP response feature said error and its status code, otherwise use the status code 500.
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
    next: NextFunction
) => {
    if (err instanceof AppError) {
        logger.error(
            `user id: ${req.user?.id || "anonymous"} - ${err.message}`
        );
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }

    logger.error(err.stack || err);
    return res.status(500).json({
        status: "error",
        message:
            process.env.NODE_ENV === "development"
                ? err.message
                : "Internal server error",
    });
};
