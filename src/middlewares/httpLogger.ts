import type { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger.js";

/**
 * Log HTTP requests and its result if the minLevel of the logger is set to 1 or higher
 * @param req HTTP request
 * @param res HTTP response
 * @param next Next function
 */
export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    logger.info(`→ ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        userID: req.user?.id || "anonymous",
    });

    const originalSend = res.send;
    res.send = function (data: any) {
        const duration = Date.now() - startTime;

        const logMethod = res.statusCode >= 400 ? "error" : "info";

        logger[logMethod](
            `← ${req.method} ${req.originalUrl} ${res.statusCode}`, {
                duration: `${duration}ms`,
                statusCode: res.statusCode,
                userId: req.user?.id || "anonymous",
            }
        );

        return originalSend.call(this, data);
    };
    next();
};
