import type { User } from "../../models/User.js";
import type { Request, Response, NextFunction } from "express";

export interface IUserService {

    testCredentials(
        name: string,
        email: string,
        password: string
    ): Promise<User>;

    private login(user: User): {
        accessToken: string;
        refreshToken: string;
    };

    prepareTokens(res: Response, status: number, user: User): Promise<void>;

    createUser(req: Request, res: Response, next: NextFunction): Promise<void>;

    getUserById(userId: number): Promise<User>;

    getUserByName(name: string): Promise<User>;

    getUserByEmail(email: string): Promise<User>;

    loginUser(req: Request, res: Response, next: NextFunction): Promise<void>;

    logoutUser(req: Request, res: Response, next: NextFunction): Promise<void>;

    refreshToken(req: Request, res: Response, next: NextFunction): Promise<void>;

    getProfile(req: Request, res: Response, next: NextFunction): Promise<void>;

    getAllUser(req: Request, res: Response, next: NextFunction): Promise<void>;

    getUser(req: Request, res: Response, next: NextFunction): Promise<void>;

    updateUser(req: Request, res: Response, next: NextFunction): Promise<void>;

    updatePassword(req: Request, res: Response, next: NextFunction): Promise<void>

    deleteUser(req: Request, res: Response, next: NextFunction): Promise<void>;

    deleteUserById(req: Request, res: Response, next: NextFunction): Promise<void>;

}
