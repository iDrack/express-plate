import jwt from "jsonwebtoken";
import { AppError } from "../middlewares/errorHandler.js";

interface JwtPayload {
    id: number;
    name: string;
    role: string;
}

export class JwtService {
    private static SECRET = process.env.JWT_SECRET as string;
    private static REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
    private static EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
    private static REFRESH_EXPIRES_IN =
        process.env.JWT_REFRESH_EXPIRES_IN || "7d";

    static generateAccessToken(payload: JwtPayload): string {
        if (!this.SECRET) {
            throw new AppError("MMissing JWT secret in .env.", 500);
        }
        return jwt.sign(payload, this.SECRET, {
            expiresIn: this.EXPIRES_IN as string,
        });
    }

    static generateRefreshToken(payload: JwtPayload): string {
        if (!this.REFRESH_SECRET) {
            throw new AppError("Missing JWT refresh token in .env.", 500);
        }
        return jwt.sign(payload, this.REFRESH_SECRET, {
            expiresIn: this.REFRESH_EXPIRES_IN as string,
        });
    }

    static verifyAccessToken(token: string): JwtPayload {
        try {
            return jwt.verify(token, this.SECRET) as JwtPayload;
        } catch (error) {
            throw new AppError("Invalid or expired token.", 500);
        }
    }

    static verifyRefreshToken(token: string): JwtPayload {
        try {
            return jwt.verify(token, this.REFRESH_SECRET) as JwtPayload;
        } catch (error) {
            throw new AppError("Invalid or expired refresh token", 500);
        }
    }
}
