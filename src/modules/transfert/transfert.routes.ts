import { Router } from "express";
import { apiLimiter } from "../../middlewares/rateLimiter.js";
import { TransfertController } from "./transfert.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { upload } from "../../middlewares/upload.js";

const router = Router();
const controller = new TransfertController();

router.use(apiLimiter);

/**
 * @swagger
 * tags:
 *   name: Transfert
 *   description: File upload endpoints.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FileInfo:
 *       type: object
 *       description: Stored file entity.
 *       properties:
 *         id:
 *           type: integer
 *           example: 42
 *         originalName:
 *           type: string
 *           example: report.pdf
 *         storedAs:
 *           type: string
 *           example: 8fK3l2aQ-report.pdf
 *         path:
 *           type: string
 *           example: bucket/1/8fK3l2aQ-report.pdf
 *         size:
 *           type: integer
 *           example: 102400
 *         mimeType:
 *           type: string
 *           example: application/pdf
 *         userId:
 *           type: integer
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-02-13T10:15:30.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-02-13T10:15:30.000Z
 *       required:
 *         - id
 *         - originalName
 *         - storedAs
 *         - path
 *         - size
 *         - mimeType
 *         - userId
 *     FileMetaData:
 *       type: object
 *       description: File metadata returned by upload endpoints.
 *       properties:
 *         id:
 *           type: integer
 *           example: 42
 *         originalName:
 *           type: string
 *           example: report.pdf
 *         storedAs:
 *           type: string
 *           example: 8fK3l2aQ-report.pdf
 *         size:
 *           type: integer
 *           example: 102400
 *         mimeType:
 *           type: string
 *           example: application/pdf
 *         userId:
 *           type: integer
 *           example: 1
 *       required:
 *         - id
 *         - originalName
 *         - storedAs
 *         - size
 *         - mimeType
 *         - userId
 */

/**
 * @swagger
 * /file/upload:
 *   post:
 *     summary: Upload multiple files
 *     tags: [Transfert]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *             required:
 *               - file
 *     responses:
 *       200:
 *         description: Files uploaded successfully.
 *       401:
 *         description: Unauthorized.
 *       413:
 *         description: File too large.
 */
router.post(
    "/upload",
    authenticate,
    upload.array("file", 10),
    controller.uploadMultipleFile,
);

export default router;
