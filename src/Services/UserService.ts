import { AppDataSource } from "../config/database.js";
import bcrypt from "bcrypt";
import { User } from "../Models/User.js";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../Middlewares/errorHandler.js";
import { JwtService } from "./JwtService.js";

const userRepository = AppDataSource.getRepository(User);

export const loginUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, password } = req.body;
        if (!name || !password) {
            throw new AppError(
                "Nom d'utilisateur ou mot de passe incorrect",
                400
            );
        }
        //Vérifications des paramètres de connexion de l'utilisateur
        const user = await userRepository.findOne({ where: { name } });
        if (!user) {
            throw new AppError(`Nom d'utilisateur introuvable.`, 404);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError("Mot de passe incorrect", 401);
        }

        //Créaations des Tokens
        const accessToken = JwtService.generateAccessToken({
            id: user.id,
            name: user.name,
            role: user.role,
        });

        const refreshToken = JwtService.generateRefreshToken({
            id: user.id,
            name: user.name,
            role: user.role,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.MODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000, //30 jours
            path: "/users/refresh",
        });

        res.status(200).json({
            status: "success",
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                },
                accessToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const logoutUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        res.clearCookie("refreshToken", { path: "/users/refresh" });

        res.status(200).json({
            status: "success",
            message: "Déconnexion réussie.",
        });
    } catch (error) {
        next(error);
    }
};

export const refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            throw new AppError("Refresh token manquant", 400);
        }
        const decoded = JwtService.verifyRefreshToken(refreshToken);

        const newAccessToken = JwtService.generateAccessToken({
            id: decoded.id,
            name: decoded.name,
            role: decoded.role,
        });

        res.status(200).json({
            status: "success",
            data: {
                accessToken: newAccessToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user.id) {
            throw new AppError("Utilisateur non authentifié", 401);
        }

        const user = await userRepository.findOne({
            where: { id: req.user.id },
            select: ["id", "name"],
        });

        if (!user) {
            throw new AppError("Utilisateur introuvable", 404);
        }

        res.status(200).json({
            status: "success",
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

export const getAllUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const users = await userRepository.find({
            select: ["id", "name", "email", "password", "role"],
        });
        res.json({ status: "success", data: users });
    } catch (error) {
        next(error);
    }
};

export const getUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (req.params.id === undefined) {
            throw new Error("Identifiant manquant.");
        } else {
            const user = await userRepository.findOne({
                where: { id: parseInt(req.params.id) },
                select: ["id", "name"],
            });
            if (!user) {
                throw new AppError("User not found", 404);
            }
            res.json({ status: "success", data: user });
        }
    } catch (error) {
        next(error);
    }
};

export const createUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const passwordRegex =
            /^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\d)(?=.*[!#$%&? "]).*$/;
        const { name, password } = req.body;
        if (!name || !password) {
            throw new AppError(
                "Un nom d'utilisateur et un mot de passe sont nécessaire.",
                400
            );
        }
        if (!passwordRegex.test(password)) {
            throw new AppError("Mot de passe invalide.", 400);
        }
        const hash = await bcrypt.hash(password, 3);
        const user = userRepository.create({ name: name, password: hash });
        await userRepository.save(user);
        res.status(201).json({
            status: "success",
            data: {
                id: user.id,
                name: user.name,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getUserById = async (userId: number) => {
    const user = await userRepository.findOne({
        where: { id: userId },
    });
    if (!user) {
        throw new AppError("Utilisateur introuvable", 401)
    }
    return user;
};
