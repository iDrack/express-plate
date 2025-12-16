import { Router } from "express";
import {
    getAllUser,
    getUser,
    createUser,
    loginUser,
    refreshToken,
    getProfile,
    logoutUser,
} from "../Services/UserService.js";
import { authenticate } from "../Middlewares/authMiddleware.js";
import {
    apiLimiter,
    loginLimiter,
    refreshLimiter,
    registerLimiter,
} from "../Middlewares/rateLimiter.js";

const router = Router();

router.use(apiLimiter);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestion des utilisateurs et authentification
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
 *           description: ID de l'utilisateur
 *         name:
 *           type: string
 *           description: Nom de l'utilisateur
 *       example:
 *         id: 1
 *         name: "John Doe"
 *     UserInput:
 *       type: object
 *       required:
 *         - name
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           description: Nom d'utilisateur
 *         password:
 *           type: string
 *           minLength: 8
 *           description: Mot de passe (min 8 caractères)
 *       example:
 *         name: "John Doe"
 *         password: "Test1234!"
 *     LoginInput:
 *       type: object
 *       required:
 *         - name
 *         - password
 *       properties:
 *         name:
 *           type: string
 *         password:
 *           type: string
 *       example:
 *         name: "John Doe"
 *         password: "Test1234!"
 *     AuthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *     Error:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: error
 *         message:
 *           type: string
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Créer un nouveau compte utilisateur
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
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
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: L'utilisateur existe déjà
 *       429:
 *         description: Trop de tentatives
 */
router.post("/register", registerLimiter, createUser);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Se connecter avec nom d'utilisateur et mot de passe
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Connexion réussie
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
 *         description: Identifiants invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Trop de tentatives de connexion
 */
router.post("/login", loginLimiter, loginUser);

/**
 * @swagger
 * /users/refresh:
 *   post:
 *     summary: Rafraîchir le token JWT
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token rafraîchi avec succès
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
 *                   example: Token rafraîchi
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *       401:
 *         description: Token invalide ou expiré
 *       429:
 *         description: Trop de tentatives
 */
router.post("/refresh", refreshLimiter, refreshToken);

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: Se déconnecter (supprime le cookie JWT)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Déconnexion réussie
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
 *                   example: Déconnexion réussie
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
 *     summary: Récupère tous les utilisateurs (Admin uniquement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.get("/", authenticate, getAllUser);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Récupère le profil de l'utilisateur connecté
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
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
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 */
router.get("/profile", authenticate, getProfile);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Récupère un utilisateur par son ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Détails de l'utilisateur
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
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get("/:id", authenticate, getUser);

export default router;