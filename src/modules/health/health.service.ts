import type { NextFunction, Request, Response } from "express";
import type { DataSource } from "typeorm";
import { AppDataSource } from "../../config/database.js";
import {
    HealthStatus,
    type DependencyCheck,
} from "./health.types.js";

class HealthService {

    private static instance: HealthService
    private startTime: number;
    private dataSource: DataSource;

    static getInstance(): HealthService{
        if(!HealthService.instance) {
            HealthService.instance = new HealthService();
        }
        return HealthService.instance;
    }

    private constructor() {
        this.startTime = Date.now();
        this.dataSource = AppDataSource;
    }

    /**
     * Get API uptime in seconds
     * @returns uptime
     */
    getUptime(): number {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    /**
     * Check database connection and response time.
     * @returns Database status.
     */
    async checkDatabase(): Promise<DependencyCheck> {
        const startTime = Date.now();
        try {
            await this.dataSource.query("SELECT 1");
            const responseTime = Date.now() - startTime;

            if (!this.dataSource.isInitialized) {
                return {
                    status: HealthStatus.UNHEALTHY,
                    responseTime,
                    message: "Database is not initialized.",
                };
            }

            if (responseTime > 1000) {
                return {
                    status: HealthStatus.DEGRADED,
                    responseTime,
                    message: "Slow response time.",
                };
            }

            return {
                status: HealthStatus.HEALTHY,
                responseTime,
                message: "Connection successful.",
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                status: HealthStatus.UNHEALTHY,
                responseTime,
                message:
                    error instanceof Error ? error.message : "Error unknown.",
            };
        }
    }

    /**
     * Check API memory usage.
     * @returns Memory status.
     */
    checkMemory(): DependencyCheck {
        const used = process.memoryUsage();
        const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
        const percentUsed = heapUsedMB / heapTotalMB / 100;

        let status = HealthStatus.HEALTHY;
        let message = `${heapUsedMB}MB / ${heapTotalMB}MB (${percentUsed.toFixed(
            1
        )}%)`;
        if (percentUsed > 80 && percentUsed <= 90) {
            status = HealthStatus.DEGRADED;
            message += " - High memory usage";
        }
        if (percentUsed > 90) {
            status = HealthStatus.UNHEALTHY;
            message += " - Critical memory usage";
        }

        return {
            status,
            responseTime: 0,
            message,
        };
    }

    /**
     * Determine the global status of the API.
     * @param checks Record of checks.
     * @returns Global status of every dependencies for the API.
     */
    checkGlobalStatus(checks: Record<string, DependencyCheck>): HealthStatus {
        const statuses = Object.values(checks).map((check) => check.status);

        if (statuses.some((status) => status === HealthStatus.UNHEALTHY))
            return HealthStatus.UNHEALTHY;
        if (statuses.some((status) => status === HealthStatus.DEGRADED))
            return HealthStatus.DEGRADED;
        return HealthStatus.HEALTHY;
    }
}

export const healthService = HealthService.getInstance();