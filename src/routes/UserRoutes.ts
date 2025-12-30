import { Router } from "express";
import { createUser, deleteUser, deleteUserById, getAllUser, getProfile, getUser, loginUser, logoutUser, refreshToken, updatePassword, updateUser } from "../services/UserService.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import {
    apiLimiter,
    loginLimiter,
    refreshLimiter,
    registerLimiter,
} from "../middlewares/rateLimiter.js";

const router = Router();

router.use(apiLimiter);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Users and authentification management endpoints.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: User id
 *         email:
 *           type: string
 *           format: email
 *           description: User e-mail address (must be a unique address)
 *         name:
 *           type: string
 *           description: Username (must be unique) 
 *         role:
 *           type: string
 *           enum: [User, Admin]
 *           description: User role, used to manage access to different ressources inside this application
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when user has been created (ISO format)
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date of last modification of the user (ISO format)
 *       example:
 *         id: 1
 *         email: "contact@jdoe.com"
 *         name: "John Doe"
 *         role: "Admin"
 *         createdAt: "2025-06-12T00:00:00.000Z"
 *         updatedAt: "2025-06-12T00:00:00.000Z"
 *     UserInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           description: Username
 *         email:
 *           type: string
 *           format: email
 *           description: Email address (must be unique)
 *         password:
 *           type: string
 *           minLength: 8
 *           pattern: '^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\d)(?=.*[!#$%&? "]).*$'
 *           description: Password (8 characters minimum, must contain letters, numbers and special characters)
 *       example:
 *         name: "John Doe"
 *         email: "contact@jdoe.com"
 *         password: "Test1234!"
 *     LoginInput:
 *       type: object
 *       required:
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: Username (provide either name or email)
 *         email:
 *           type: string
 *           format: email
 *           description: Email address (provide either name or email)
 *         password:
 *           type: string
 *           description: User password
 *       example:
 *         email: "contact@jdoe.com"
 *         password: "Test1234!"
 *     AuthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: User ID
 *                 name:
 *                   type: string
 *                   description: Username
 *                 role:
 *                   type: string
 *                   description: User role
 *             accessToken:
 *               type: string
 *               description: JWT access token
 *       example:
 *         status: "success"
 *         data:
 *           user:
 *             id: 1
 *             name: "John Doe"
 *             role: "User"
 *           accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     Error:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: error
 *         message:
 *           type: string
 *           description: Error message
 *       example:
 *         status: "error"
 *         message: "Invalid credentials"
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Create new user account
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: jwt=abcde12345; HttpOnly; Secure
 *       400:
 *         description: Invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exist
 *       429:
 *         description: Too many attempts
 */
router.post("/register", registerLimiter, createUser);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Login with user or e-mail and password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: jwt=abcde12345; HttpOnly; Secure
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many attempts
 */
router.post("/login", loginLimiter, loginUser);

/**
 * @swagger
 * /users/refresh:
 *   post:
 *     summary: Refresh JWT access token
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: JWT access token refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *       401:
 *         description: Invalid or expired token
 *       429:
 *         description: Too many attempts
 */
router.post("/refresh", refreshLimiter, refreshToken);

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: Disconnect current user and destroy ant JWT
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Logout successful
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: jwt=; Max-Age=0
 */
router.post("/logout", logoutUser);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get every users data, need to be Admin
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User datas
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Not logged in
 *       403:
 *         description: Access denied
 */
router.get("/", authenticate, authorize(["Admin"]), getAllUser);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get the profile for the user currently logged in
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *       401:
 *         description: Not logged in
 */
router.get("/profile", authenticate, getProfile);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user data by specified id, need to be Admin
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User id
 *     responses:
 *       200:
 *         description: User data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Not logged in
 *       404:
 *         description: User not found
 */
router.get("/:id", authenticate, authorize(["Admin"]), getUser);

//TODO: add swagger doc, description + model test
router.put("/", authenticate, updateUser);

router.put("/passwordChange", authenticate, updatePassword)

router.delete('/',authenticate, deleteUser);

router.delete('/:id', authenticate, authorize(['ADMIN']), deleteUserById);

export default router;
