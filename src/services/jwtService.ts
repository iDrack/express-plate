import jwt from "jsonwebtoken";
import { AppError } from "../middlewares/errorHandler.js";

interface JwtPayload {
    id: number;
    name: string;
    role: string;
}

export class JwtService {
    private static SECRET = process.env.JWT_SECRET!;
    private static REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
    private static EXPIRES_IN: string | number = "1h";
    private static REFRESH_EXPIRES_IN: string | number =
        process.env.JWT_REFRESH_EXPIRES_IN || "7d";

    static generateAccessToken(payload: JwtPayload): string {
        if (!this.SECRET) {
            throw new AppError("Missing JWT SECRET in .env.", 500);
        }

        return jwt.sign(
            payload,
            this.SECRET,
            this.EXPIRES_IN as unknown as jwt.SignOptions
        );
    }

    static generateRefreshToken(payload: JwtPayload): string {
        if (!this.REFRESH_SECRET) {
            throw new AppError("Missing JWT REFRESH SECRET in .env.", 500);
        }
        return jwt.sign(
            payload,
            this.REFRESH_SECRET,
            this.REFRESH_EXPIRES_IN as unknown as jwt.SignOptions
        );
    }

    static verifyAccessToken(token: string): JwtPayload {
        try {
            return jwt.verify(token, this.SECRET) as JwtPayload;
        } catch (error) {
            throw new AppError("Invalid or expired token", 401);
        }
    }

    static verifyRefreshToken(token: string): JwtPayload {
        try {
            return jwt.verify(token, this.REFRESH_SECRET) as JwtPayload;
        } catch (error) {
            throw new AppError("Invalid or expired refresh token", 401);
        }
    }
}
