import { AppError } from "../../middlewares/errorHandler.js";
import type { User } from "../../models/User.js";
import { JwtService } from "../core/jwt.service.js";
import { UserService } from "./user.service.js";
import type { Request, Response, NextFunction } from "express";
import type { UserProfile } from "./user.types.js";

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
        this.createUser = this.createUser.bind(this);
        this.loginUser = this.loginUser.bind(this);
        this.logoutUser = this.logoutUser.bind(this);
        this.refreshToken = this.refreshToken.bind(this);
        this.getProfile = this.getProfile.bind(this);
        this.getAllUser = this.getAllUser.bind(this);
        this.getUser = this.getUser.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.updatePassword = this.updatePassword.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
        this.deleteUserById = this.deleteUserById.bind(this);
    }

    /**
     * Log an User then add it's accessToken to response body and refreshToken to the cookies.
     * @param res Response to send back with JWT Tokens.
     * @param status HTTP Status of the response.
     * @param user User getting logged in.
     */
    async prepareTokens(res: Response, status: number, user: User) {
        const { accessToken, refreshToken } = this.userService.login(user);

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
    }

    /**
     * Create a new user then proceed to log in the newly created user.
     * @param req Incoming HTTP request.
     * @param res Response or the incoming HTTP request.
     * @param next Following function.
     */
    async createUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const { name, email, password } = req.body;
            if (!name || !email || !password) {
                throw new AppError(
                    "You need a name, an e-mail and a password to create a user account.",
                    400
                );
            }

            try {
                if (await this.userService.getUserByEmail(email)) {
                    throw new AppError(
                        `E-mail :${email} is already in use, please try a different one.`,
                        409
                    );
                }
            } catch (error) {
                if (error instanceof AppError && error.statusCode !== 404) {
                    throw error;
                }
            }

            try {
                if (await this.userService.getUserByName(name)) {
                    throw new AppError(
                        `Username :${email} is already in use, please try a different one.`,
                        409
                    );
                }
            } catch (error) {
                if (error instanceof AppError && error.statusCode !== 404) {
                    throw error;
                }
            }
            const user = await this.userService.createUser(
                name,
                email,
                password
            );
            await this.prepareTokens(res, 201, user);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Log a user by using its username or email and its password.
     * @param req Incoming HTTP request.
     * @param res Response or the incoming HTTP request.
     * @param next Following function.
     */
    async loginUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const { name, email, password } = req.body;
            if (!password || (!name && !email)) {
                throw new AppError("Invalid credentials.", 400);
            }
            const user = await this.userService.testCredentials(
                name,
                email,
                password
            );
            await this.prepareTokens(res, 200, user);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Logout the user by clearing its refresh token from its cookies.
     * @param req Incoming HTTP request.
     * @param res Response or the incoming HTTP request.
     * @param next Following function.
     */
    async logoutUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            res.clearCookie("refreshToken", { path: "/users/refresh" });
            res.status(200).json({
                status: "success",
                message: "Logout successful.",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Refresh access token by using the provided refresh token stored inside the user's cookies.
     * @param req Incoming HTTP request.
     * @param res Response or the incoming HTTP request.
     * @param next Following function.
     */
    async refreshToken(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
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
    }

    /**
     * Get user profile informations.
     * @param req Incoming HTTP request.
     * @param res Response or the incoming HTTP request.
     * @param next Following function.
     */
    async getProfile(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user.id) {
                throw new AppError(
                    "You need to be logged in to access your profile.",
                    401
                );
            }

            const user: User = await this.userService.getUserById(req.user.id);

            if (!user) {
                throw new AppError("User not found.", 404);
            }

            const userProfile: UserProfile = {
                id: req.user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            };

            res.status(200).json({
                status: "success",
                data: userProfile,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Return a list of all users.
     * @param req Incoming HTTP request.
     * @param res Response or the incoming HTTP request.
     * @param next Following function.
     */
    async getAllUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const users = await this.userService.getAllUsers();
            if (users) {
                res.json({ status: "success", data: users });
            }
            res.json({ status: "success", data: [] });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Return a user using the provided user id.
     * @param req Incoming HTTP request.
     * @param res Response or the incoming HTTP request.
     * @param next Following function.
     */
    async getUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (req.params.id === undefined) {
                throw new AppError("Missing userId.", 404);
            } else {
                const user = await this.userService.getUserById(
                    parseInt(req.params.id)
                );
                if (!user) {
                    throw new AppError("User not found.", 404);
                }
                const response = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    createdAt: user.createdAtLocal,
                    updatedAt: user.updatedAt,
                };
                res.json({ status: "success", data: response });
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user informations.
     * @param req Incoming HTTP request.
     * @param res Response or the incoming HTTP request.
     * @param next Following function.
     */
    async updateUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user.id) {
                throw new AppError(
                    "You need to be logged in to update your profile.",
                    401
                );
            }
            const { email, name, role } = req.body;
            const user = await this.userService.updateUser(req.user.id, {
                name: name,
                email: email,
                role: role,
            });
            //Login user again to get new tokens based on the updated data
            await this.prepareTokens(res, 200, user);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user password. The provided password is hashed before being stored inside the database.
     * @param req Incoming HTTP request.
     * @param res Response or the incoming HTTP request.
     * @param next Following function.
     */
    async updatePassword(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user.id) {
                throw new AppError(
                    "You need to be logged in to update your profile.",
                    401
                );
            }

            const { oldPassword, newPassword } = req.body;
            const user = await this.userService.updatePassword(
                req.user.id,
                oldPassword,
                newPassword
            );

            //Login user again to get new tokens based on the updated data
            await this.prepareTokens(res, 200, user);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete the currently logged in user from the database before disconnecting the user.
     * The user need to specify its password to ensure its identity.
     * @param req Incoming HTTP request.
     * @param res Response or the incoming HTTP request.
     * @param next Following function.
     */
    async deleteUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user.id) {
                throw new AppError(
                    "You need to be logged in to update your profile.",
                    401
                );
            }
            const { password } = req.body;
            if (await this.userService.deleteUser(req.user.id, password)) {
                res.clearCookie("refreshToken", { path: "/users/refresh" });

                res.status(200).json({
                    message: "Account deleted successfully.",
                });
            } else {
                throw new AppError(
                    "Cannot delete user account : Incorrect password.",
                    401
                );
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a user be using the provided user id.
     * @param req Incoming HTTP request.
     * @param res Response or the incoming HTTP request.
     * @param next Following function.
     */
    async deleteUserById(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.params.id;

            if (userId === undefined) {
                throw new AppError("Missing userId", 404);
            }
            this.userService.deleteUserById(parseInt(userId));
            res.status(200).json({
                status: "success",
                message: `User: ${userId} has been deleted successfully.`,
            });
        } catch (error) {
            next(error);
        }
    }
}
