import type { NextFunction } from "express";
import { JwtService } from "../services/jwtService.js";

declare global {
    namespace Express {
        interface Request {
            user: {
                id: Number,
                name: string,
                role: string,
            }
        }
    }
}

/* export interface AuthRequest extends Request {
    user?: { id: string; name: string; role: string };
} */
 
export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    /* try {
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError("Please login.", 401);
        }
        const token = authHeader.split(" ")[1];        
        const decoded = JwtService.verifyAccessToken(token as string);
        req.user = { id: decoded.id, name: decoded.name, role: decoded.role };
        next();
    } catch (error) {
        next(error)
    } */
}