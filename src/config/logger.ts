import type { NextFunction, Request, Response } from "express";
import { Logger } from "tslog";

export const logger = new Logger({
    name: "Log_1",
    minLevel:  process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : process.env.NODE_ENV === "production" ? 2 : 0,
    type: "pretty",

    prettyLogTemplate: "{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}}\t{{logLevelName}}:\t",
    prettyErrorTemplate: "\n{{errorName}} {{errorMessage}}\nerror stack:\n{{errorStack}}",
    prettyErrorStackTemplate: "  • {{fileName}}\t{{method}}\n\t{{filePathWithLine}}",
    prettyErrorParentNamesSeparator: ":",
    prettyErrorLoggerNameDelimiter: "\t",
    stylePrettyLogs: true,
    prettyLogTimeZone: "local",
    
    hideLogPositionForProduction: process.env.NODE_ENV === "production",
});

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
        userAgent: req.get('user-agent'),
        userID: req.user?.id || 'anonymous'
    });

    const originalSend = res.send;
    res.send = function(data: any) {
        const duration = Date.now() - startTime;

        const logMethod = res.statusCode >= 400 ? 'error' : 'info';

        logger[logMethod](`← ${req.method} ${req.originalUrl} ${res.statusCode}`, {
            duration: `${duration}ms`,
            statusCode: res.statusCode,
            userId : req.user?.id || 'anonymous'
        });

        return originalSend.call(this, data);
    }
    next();
}

//TODO: Trouver un moyen d'enregistrer les logs, aussi paramétrable