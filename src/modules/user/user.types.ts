import type { Role } from "../../models/Role.js";

export interface TokensResponse {
    accessToken: string;
    refreshToken: string;
}

export interface UserProfile {
    id: number,
    name: string,
    email: string,
    role: Role
}