import { AppDataSource } from "../config/database.js";
import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../middlewares/errorHandler.js";
import { JwtService } from "./JwtService.js";
import { isRole, Role } from "../models/Role.js";

const userRepository = AppDataSource.getRepository(User);
const passwordRegex = /^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\d)(?=.*[!#$%&? "]).*$/;

/**
 * Test user credentials, an email or a username is needed to identify an user.
 * If credentials are correct, returns the user identified by it's username or email.
 * If the test fails or the user cannot be found, throw an exception.
 * @param name Username of the user trying to log in.
 * @param email Email of the user trying to log in.
 * @param password Password of the user trying to log in.
 * @returns
 */
const testCredentials = async (
    name: string,
    email: string,
    password: string
): Promise<User> => {
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
    return user;
};

/**
 * Generate an accessToken and a refreshToken for a specified User.
 * @param user User to generate tokens for.
 * @returns
 */
const login = (
    user: User
): {
    accessToken: string;
    refreshToken: string;
} => {
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
    return {
        accessToken: accessToken,
        refreshToken: refreshToken,
    };
};

/**
 * Log an User then add it's accessToken to response body and refreshToken to the cookies.
 * @param res Response to send back with JWT Tokens.
 * @param status HTTP Status of the response.
 * @param user User getting logged in.
 */
const prepareTokens = async (res: Response, status: number, user: User) => {
    const { accessToken, refreshToken } = login(user);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
        path: "/users/refresh",
    });
    res.status(status).json({
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
};

export const getUserById = async (userId: number): Promise<User> => {
    const user = await userRepository.findOne({
        where: { id: userId },
    });
    if (!user) {
        throw new AppError("User not found.", 404);
    }
    return user;
};

export const checkUserExist = async (userId: number): Promise<boolean> => {
    try {
        const user = await userRepository.findOne({
            where: { id: userId },
        });
        return user !== undefined;
    } catch (error) {
        console.log(error);
        return false;
    }
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

export const getUserByEmail = async (email: string) => {
    const user = await userRepository.findOne({
        where: { email: email },
    });
    if (!user) {
        throw new AppError("User not found.", 404);
    }
    return user;
};

export const createUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            throw new AppError(
                "You need a name, an e-mail and a password to create a user account.",
                400
            );
        }
        if (await userRepository.findOne({ where: { email } })) {
            throw new AppError(
                `E-mail :${email} is already in use, please try a different one.`,
                409
            );
        }
        if (await userRepository.findOne({ where: { name } })) {
            throw new AppError(
                `Username :${email} is already in use, please try a different one.`,
                409
            );
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
        await prepareTokens(res, 201, user);
    } catch (error) {
        next(error);
    }
};

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
        const user = await testCredentials(name, email, password);
        await prepareTokens(res, 200, user);
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
            throw new AppError(
                "You need to be logged in to access your profile.",
                401
            );
        }

        const user = await userRepository.findOne({
            where: { id: req.user.id },
            select: ["id", "name", "email"],
        });

        if (!user) {
            throw new AppError("User not found.", 404);
        }
        req.log.info('test')

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
            throw new AppError("Missing userId.", 404);
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

export const updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user.id) {
            throw new AppError(
                "You need to be logged in to update your profile.",
                401
            );
        }
        const userToUpdate = await getUserById(req.user.id);

        const { email, name, role } = req.body;

        if (email) userToUpdate.email = email;
        if (name) userToUpdate.name = name;
        if (role && isRole(role.toUpperCase()))
            userToUpdate.role = role.toUpperCase();

        userRepository.save(userToUpdate);

        //Login user again to get new tokens based on the updated data
        await prepareTokens(res, 200, userToUpdate);
    } catch (error) {
        next(error);
    }
};

export const updatePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user.id) {
            throw new AppError(
                "You need to be logged in to update your profile.",
                401
            );
        }

        const userToUpdate = await getUserById(req.user.id);
        const { password, newPassword } = req.body;

        const isPasswordValid = await bcrypt.compare(
            password,
            userToUpdate.password
        );
        if (!isPasswordValid) {
            throw new AppError("Incorrect password.", 401);
        }

        if (!passwordRegex.test(newPassword)) {
            throw new AppError("Invalid password format.", 400);
        }

        const hash = await bcrypt.hash(newPassword, 3);

        userToUpdate.password = hash;

        userRepository.save(userToUpdate);

        //Login user again to get new tokens based on the updated data
        await prepareTokens(res, 200, userToUpdate);
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user.id) {
            throw new AppError(
                "You need to be logged in to update your profile.",
                401
            );
        }

        const user = await getUserById(req.user.id);
        const { password } = req.body;
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError(
                "Cannot delete user account : Incorrect password.",
                401
            );
        }
        userRepository.delete(user.id);
        res.clearCookie("refreshToken", { path: "/users/refresh" });

        res.status(200).json({
            message: "Account deleted successfully.",
        });
    } catch (error) {
        next(error);
    }
};

export const deleteUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.params.id;

        if (userId === undefined) {
            throw new AppError("Missing userId", 404);
        }
        const user = await getUserById(parseInt(userId));
        userRepository.delete(user.id);
        res.status(200).json({
            status: "success",
            message: `User ${userId} has been deleted successfully.`,
        });
    } catch (error) {
        next(error);
    }
};
