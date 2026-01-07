import type { Request, Response, NextFunction } from "express";
import {
    HealthStatus,
    type DetailedHealthCheckResponse,
    type ReadinessCheckResponse,
} from "./health.types.js";
import { healthService } from "./health.service.js";

export class HealthController {

    constructor() {
        this.ping = this.ping.bind(this);
        this.isAlive = this.isAlive.bind(this);
        this.isReady = this.isReady.bind(this);
        this.healthCheck = this.healthCheck.bind(this);
    }
    /**
     * Simple function to quickly test if the API is up or not.
     * @param req Incoming HTTP request.
     * @param res Response or the incoming HTTP request.
     * @param next Following function.
     */
    async ping(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const uptime = healthService.getUptime();
            res.status(200).json({
                status: HealthStatus.HEALTHY,
                timestamp: new Date().toISOString(),
                uptime: uptime,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Liveness probe, check if process is alive.
     * @param req Incoming HTTP request.
     * @param res Response or the incoming HTTP request.
     * @param next Following function.
     */
    async isAlive(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            res.status(200).json({
                status: "alive",
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    }

    async isReady(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const dbCheck = await healthService.checkDatabase();
            const isDBReady = dbCheck.status === HealthStatus.HEALTHY;

            const response: ReadinessCheckResponse = {
                status: isDBReady ? "ready" : "not_ready",
                timestamp: new Date().toISOString(),
                dependencies: {
                    database: isDBReady,
                },
            };

            res.status(isDBReady ? 200 : 503).json(response);
        } catch (error) {
            const response: ReadinessCheckResponse = {
                status: "not_ready",
                timestamp: new Date().toISOString(),
                dependencies: {
                    database: false,
                },
            };

            res.status(503).json(response);
        }
    }

    async healthCheck(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const [dbCheck, memoryCheck] = await Promise.all([
                healthService.checkDatabase(),
                Promise.resolve(healthService.checkMemory()),
            ]);

            const checks = {
                database: dbCheck,
                memory: memoryCheck,
            };

            const overallStatus = healthService.checkGlobalStatus(checks);

            const response: DetailedHealthCheckResponse = {
                status: overallStatus,
                timestamp: new Date().toISOString(),
                uptime: healthService.getUptime(),
                checks,
                version: process.env.APP_VERSION || "1.0.0",
                environment: process.env.NODE_ENV || "development",
            };

            const statusCode =
                overallStatus === HealthStatus.UNHEALTHY ? 503 : 200;
            res.status(statusCode).json(response);
        } catch (error) {
            const response: DetailedHealthCheckResponse = {
                status: HealthStatus.UNHEALTHY,
                timestamp: new Date().toISOString(),
                checks: {},
                version: process.env.APP_VERSION || "1.0.0",
                environment: process.env.NODE_ENV || "development",
            };

            res.status(503).json(response);
        }
    }
}
