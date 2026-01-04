import type { Request, Response, NextFunction } from "express";
import { JwtService } from "../services/JwtService.js";
import { AppError } from "./errorHandler.js";
import { checkUserExist } from "../services/UserService.js";

declare global {
    namespace Express {
        interface Request {
            user: {
                id: number;
                name: string;
                role: string;
            };
        }
    }
}

export interface AuthRequest extends Request {
    user: { id: number; name: string; role: string };
}

/**
 * Check if the user is logged in. This is accomplished by testing an Bearer token in the request header.
 * After the user is logged in, the user datas are then stored inside the request under the 'user' object and correspond to the interface AuthRequest.
 * In the instance a token return a deleted user the authentification will fail.
 * @param req Incoming request.
 * @param res Response for the incoming request.
 * @param next Function to execute after this one.
 */
export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError("You need to be logged in.", 401);
        }
        const token = authHeader.split(" ")[1];
        const decoded = JwtService.verifyAccessToken(token as string);       

        if (!checkUserExist(decoded.id))
            throw new AppError("User no longer exists.", 401);

        req.user = {
            id: decoded.id,
            name: decoded.name,
            role: decoded.role,
        };
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Check if the logged in user posses the required role to access a specific resource.
 * @param allowedRoles Array of allowed roles.
 * @returns NextFunction or AppError.
 */
export const authorize = (allowedRoles: string[]) => {
    allowedRoles.forEach((role) => {
        role = role.toLowerCase();
    });
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            next(
                new AppError(
                    "You need to be logged in to access this ressource.",
                    401
                )
            );
        }
        if (!allowedRoles.includes(req.user.role.toLowerCase())) {
            next(
                new AppError(
                    "Forbidden: Insuffisant rights to access this ressource.",
                    403
                )
            );
        }
        next();
    };
};
