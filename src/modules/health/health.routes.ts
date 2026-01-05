import { Router } from "express";
import { apiLimiter } from "../../middlewares/rateLimiter.js";
import { HealthController } from "./health.controller.js";

const router = Router();
const controller = new HealthController();

router.use(apiLimiter);

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Health and diagnostic endpoints.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     HealthStatus:
 *       type: string
 *       enum: [healthy, unhealthy, degraded]
 *     HealthCheckResponse:
 *       type: object
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/HealthStatus'
 *         timestamp:
 *           type: string
 *           format: date-time
 *         uptime:
 *           type: number
 *     DependencyCheck:
 *       type: object
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/HealthStatus'
 *         responseTime:
 *           type: number
 *         message:
 *           type: string
 *     ReadinessCheckResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [ready, not_ready]
 *         timestamp:
 *           type: string
 *           format: date-time
 *         dependencies:
 *           type: object
 *           properties:
 *             database:
 *               type: boolean
 *           additionalProperties:
 *             type: boolean
 *     DetailedHealthCheckResponse:
 *       type: object
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/HealthStatus'
 *         timestamp:
 *           type: string
 *           format: date-time
 *         uptime:
 *           type: number
 *         checks:
 *           type: object
 *           properties:
 *             database:
 *               $ref: '#/components/schemas/DependencyCheck'
 *             redis:
 *               $ref: '#/components/schemas/DependencyCheck'
 *             memory:
 *               $ref: '#/components/schemas/DependencyCheck'
 *         version:
 *           type: string
 *         environment:
 *           type: string
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Ping the health endpoint
 *     description: Simple ping endpoint to check if the API is responding
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Successful ping response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheckResponse'
 *             example:
 *               status: healthy
 *               timestamp: "2026-01-05T16:17:13.852Z"
 *               uptime: 2
 *       429:
 *         description: Too many requests
 */
router.get("/", controller.ping);

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe
 *     description: Check if the application is alive and running
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Application is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *             example:
 *               status: alive
 *               timestamp: "2026-01-05T16:17:13.852Z"
 *       503:
 *         description: Application is not alive
 *       429:
 *         description: Too many requests
 */
router.get("/live", controller.isAlive);

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe
 *     description: Check if the application is ready to accept traffic
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Application is ready
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReadinessCheckResponse'
 *             example:
 *               status: ready
 *               timestamp: "2026-01-05T16:17:13.852Z"
 *               dependencies:
 *                 database: true
 *       503:
 *         description: Application is not ready
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReadinessCheckResponse'
 *             example:
 *               status: not_ready
 *               timestamp: "2026-01-05T16:17:13.852Z"
 *               dependencies:
 *                 database: false
 *       429:
 *         description: Too many requests
 */
router.get('/ready', controller.isReady);

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check
 *     description: Get detailed health information about the application and its dependencies
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Detailed health status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DetailedHealthCheckResponse'
 *             example:
 *               status: healthy
 *               timestamp: "2026-01-05T16:17:13.852Z"
 *               uptime: 12345
 *               checks:
 *                 database:
 *                   status: healthy
 *                   responseTime: 15
 *                 memory:
 *                   status: healthy
 *                   responseTime: 2
 *               version: "1.0.0"
 *               environment: "production"
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DetailedHealthCheckResponse'
 *             example:
 *               status: unhealthy
 *               timestamp: "2026-01-05T16:17:13.852Z"
 *               checks:
 *                 database:
 *                   status: unhealthy
 *                   responseTime: 5000
 *                   message: "Connection timeout"
 *               version: "1.0.0"
 *               environment: "production"
 *       429:
 *         description: Too many requests
 */
router.get('/detailed', controller.healthCheck);

export default router;