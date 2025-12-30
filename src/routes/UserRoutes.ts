import { Router } from "express";
import {
    createUser,
    deleteUser,
    deleteUserById,
    getAllUser,
    getProfile,
    getUser,
    loginUser,
    logoutUser,
    refreshToken,
    updatePassword,
    updateUser,
} from "../services/UserService.js";
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
 *     UserUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: New username (optional)
 *         email:
 *           type: string
 *           format: email
 *           description: New email address (optional)
 *         role:
 *           type: string
 *           enum: [USER, ADMIN]
 *           description: New user role (optional)
 *       example:
 *         name: "John Doe"
 *         email: "john.doe@test.com"
 *         role: "USER"
 *     PasswordUpdate:
 *       type: object
 *       required:
 *         - password
 *         - newPassword
 *       properties:
 *         password:
 *           type: string
 *           description: Current password
 *         newPassword:
 *           type: string
 *           minLength: 8
 *           pattern: '^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\\d)(?=.*[!#$%&? "]).*$'
 *           description: New password (8 characters minimum, must contain letters, numbers and special characters)
 *       example:
 *         password: "Test1234!"
 *         newPassword: "P@ssword1234"
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

/**
 * @swagger
 * /users:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *         description: Not logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/", authenticate, updateUser);

/**
 * @swagger
 * /users/passwordChange:
 *   put:
 *     summary: Change current user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordUpdate'
 *     responses:
 *       200:
 *         description: Password updated successfully
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
 *         description: Invalid password format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not logged in or incorrect current password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/passwordChange", authenticate, updatePassword);

/**
 * @swagger
 * /users:
 *   delete:
 *     summary: Delete current user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: Current password for confirmation
 *             example:
 *               password: "Test1234!"
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account deleted successfully.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: jwt=; Max-Age=0
 *       401:
 *         description: Not logged in or incorrect password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/", authenticate, deleteUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user by id, need to be Admin
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User id to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                   example: User 1 has been deleted successfully.
 *       401:
 *         description: Not logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:id", authenticate, authorize(["ADMIN"]), deleteUserById);

export default router;
