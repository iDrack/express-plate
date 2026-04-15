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
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *             required:
 *               - files
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
    upload.array("files", 10),
    controller.uploadMultipleFile,
);

/**
 * @swagger
 * /file/all:
 *   get:
 *     summary: Get all files for the authenticated user (paginated)
 *     tags: [Transfert]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         required: false
 *         description: Page number (default 1)
 *     responses:
 *       200:
 *         description: List of files retrieved successfully with pagination metadata.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FileMetaData'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 limit:
 *                   type: integer
 *                   example: 20
 *                 totalItems:
 *                   type: integer
 *                   example: 20
 *                 prevPage:
 *                   type: integer
 *                   example: 0
 *                 nextPage:
 *                   type: integer
 *                   example: 2
 *       401:
 *         description: Unauthorized.
 */
router.get("/all", authenticate, controller.getAllFiles);

/**
 * @swagger
 * /file/{id}:
 *   get:
 *     summary: Get file information by ID
 *     tags: [Transfert]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The file ID
 *     responses:
 *       200:
 *         description: File information retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/FileMetaData'
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: File not found.
 *       405:
 *         description: Invalid file ID.
 */
router.get("/:id", authenticate, controller.getFileById);

/**
 * @swagger
 * /file/{id}:
 *   delete:
 *     summary: Delete a file by ID
 *     tags: [Transfert]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The file ID to delete
 *     responses:
 *       200:
 *         description: File deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: string
 *                   example: File with id 42 has been deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: File not found.
 *       405:
 *         description: Invalid file ID.
 */
router.delete("/:id", authenticate, controller.deleteFileById);


/**
 * @swagger
 * /file/download/{id}:
 *   get:
 *     summary: Download a file by ID
 *     tags: [Transfert]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The file ID to download
 *     responses:
 *       200:
 *         description: File downloaded successfully.
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: File not found.
 *       405:
 *         description: Invalid file ID.
 */
router.get("/download/:id", authenticate, controller.DownloadFileById);

/**
 * @swagger
 * /file/get/{id}:
 *   get:
 *     summary: Stream a file by ID
 *     tags: [Transfert]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The file ID to stream
 *     responses:
 *       200:
 *         description: File streamed successfully.
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: File not found.
 *       405:
 *         description: Invalid file ID.
 */
router.get("/get/:id", authenticate, controller.StreamFileById);

export default router;
