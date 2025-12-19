import { AppDataSource } from "../config/database.js";
import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../middlewares/errorHandler.js";
import { JwtService } from "./JwtService.js";

const userRepository = AppDataSource.getRepository(User);

export const loginUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, email, password } = req.body;
        if (!password || (!name && !email)) {
            throw new AppError("Invalid credentials.", 400);
        }
        //Check infos against user login data
        let user;
        if (email) {
            user = await userRepository.findOne({ where: { email } });
        } else {
            user = await userRepository.findOne({ where: { name } });
        }

        if (!user) {
            throw new AppError(`Unable to find user.`, 404);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError("Incorrect password.", 401);
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
            maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
            path: "/users/refresh",
        });
        //TODO: auto connect user
        res.status(200).json({
            status: "success",
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    role: user.role,
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
            message: "Logout successful.",
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
            throw new AppError("Missing refresh token.", 400);
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
            throw new AppError("You need to be logged in to acess your profile.", 401);
        }

        const user = await userRepository.findOne({
            where: { id: req.user.id },
            select: ["id", "name", "email"],
        });

        if (!user) {
            throw new AppError("User not found.", 404);
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
            select: ["id", "name", "email", "role", "createdAt", "updatedAt"],
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
            throw new Error("Missing userId.");
        } else {
            const user = await userRepository.findOne({
                where: { id: parseInt(req.params.id) },
                select: ["id", "name", "role"],
            });
            if (!user) {
                throw new AppError("User not found.", 404);
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
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            throw new AppError(
                "You need a name, an e-mail and a password to create a user account.",
                400
            );
        }
        if(await userRepository.findOne({ where: { email }})) {
            throw new AppError(
                `E-mail :${email} is already in use, please try a different one.`,
                409,
            )
        }  
        if(await userRepository.findOne({ where: { name }})) {
            throw new AppError(
                `Username :${email} is already in use, please try a different one.`,
                409,
            )
        }

        if (!passwordRegex.test(password)) {
            throw new AppError("Invalid password format.", 400);
        }

        const hash = await bcrypt.hash(password, 3);
        const user = userRepository.create({
            name: name,
            email: email,
            password: hash,
        });
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
        throw new AppError("User not found.", 404);
    }
    return user;
};

export const getUserByName = async (name: string) => {
    const user = await userRepository.findOne({
        where: { name: name },
    });
    if (!user) {
        throw new AppError("User not found.", 404);
    }
    return user;
};

export const getuserByEmail = async (email: string) => {
    const user = await userRepository.findOne({
        where: { email: email },
    });
    if (!user) {
        throw new AppError("User not found.", 404);
    }
    return user;
};
