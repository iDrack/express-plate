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

    /**
     * Create JWT access token based on user data
     * @param payload JWT payload for user data
     * @returns JWT access token
     */
    static generateAccessToken(payload: JwtPayload): string {
        if (!this.SECRET) {
            throw new AppError("Missing JWT secret in .env.", 500);
        }
        return jwt.sign(payload, this.SECRET, {
            expiresIn: this.EXPIRES_IN as string,
        });
    }

    /**
     * Create JWT refresh token based on user data
     * @param payload JWT payload for user data
     * @returns JWT refresh token
     */
    static generateRefreshToken(payload: JwtPayload): string {
        if (!this.REFRESH_SECRET) {
            throw new AppError("Missing JWT refresh token in .env.", 500);
        }
        return jwt.sign(payload, this.REFRESH_SECRET, {
            expiresIn: this.REFRESH_EXPIRES_IN as string,
        });
    }

    /**
     * Check if a JWT is valid or not
     * @param token JWT access to token to test
     * @returns JWTPayload for tested access token
     */
    static verifyAccessToken(token: string): JwtPayload {
        try {
            return jwt.verify(token, this.SECRET) as JwtPayload;
        } catch (error) {
            throw new AppError("Invalid or expired token.", 401);
        }
    }

    /**
     * Check if a JWT is valid or not
     * @param token JWT refresh to token to test
     * @returns JWTPayload for tested refresh token
     */
    static verifyRefreshToken(token: string): JwtPayload {
        try {
            return jwt.verify(token, this.REFRESH_SECRET) as JwtPayload;
        } catch (error) {
            throw new AppError("Invalid or expired refresh token", 401);
        }
    }
}
