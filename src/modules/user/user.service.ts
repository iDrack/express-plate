import type { Repository } from "typeorm";
import { AppDataSource } from "../../config/database.js";
import { User } from "../../models/User.js";
import { AppError } from "../../middlewares/errorHandler.js";
import bcrypt from "bcrypt";
import { JwtService } from "../core/jwt.service.js";
import type { TokensResponse } from "./user.types.js";
import { logger } from "../../config/logger.js";
import { toRole } from "../../models/Role.js";

class UserService {
    private userRepository: Repository<User>;
    private passwordRegex: RegExp;
    private static instance: UserService;

    static getInstance() {
        if(!UserService.instance) {
            UserService.instance = new UserService()
        }
        return UserService.instance;
    }

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
        this.passwordRegex =
            /^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%&? "]).*$/;
    }

    /**
     * Test user credentials, an email or a username is needed to identify an user.
     * If credentials are correct, returns the user identified by it's username or email.
     * If the test fails or the user cannot be found, throw an exception.
     * @param name Username of the user trying to log in.
     * @param email Email of the user trying to log in.
     * @param password Password of the user trying to log in.
     * @returns Promise containing the user.
     */
    async testCredentials(
        name: string,
        email: string,
        password: string
    ): Promise<User> {
        let user;
        if (email) {
            user = await this.userRepository.findOne({ where: { email } });
        } else {
            user = await this.userRepository.findOne({ where: { name } });
        }

        if (!user) {
            throw new AppError(`Unable to find user.`, 404);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError("Incorrect password.", 401);
        }
        return user;
    }

    /**
     * Generate an accessToken and a refreshToken for a specified User.
     * @param user User to generate tokens for.
     * @returns Object with both access and refresh token.
     */
    login(user: User): TokensResponse {
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
    }

    /**
     * Return an User based on its ID.
     * @param userId ID of requested user.
     * @returns Found user.
     */
    async getUserById(userId: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new AppError("User not found.", 404);
        }
        return user;
    }

    /**
     * Verify if a user ID correspond to a user saved in the database.
     * @param userId ID of requested user.
     * @returns True if user exist, false otherwise.
     */
    async checkUserExist(userId: number): Promise<boolean> {
        try {
            const user = await this.userRepository.findOne({
                where: { id: userId },
            });
            return user !== undefined;
        } catch (error) {
            logger.error(error);
            return false;
        }
    }

    /**
     * Find an user based on its username.
     * @param name Name of the user.
     * @returns User found by the username.
     */
    async getUserByName(name: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { name: name },
        });
        if (!user) {
            throw new AppError("User not found.", 404);
        }
        return user;
    }

    /**
     * Find an user based on its email address.
     * @param email email of the user.
     * @returns User found by the email address.
     */
    async getUserByEmail(email: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { email: email },
        });
        if (!user) {
            throw new AppError("User not found.", 404);
        }
        return user;
    }

    async createUser(
        name: string,
        email: string,
        password: string
    ): Promise<User> {
        if (!this.passwordRegex.test(password)) {
            throw new AppError("Invalid password format.", 400);
        }

        const hash = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({
            name: name,
            email: email,
            password: hash,
        });
        return await this.userRepository.save(user);
    }

    /**
     * Find every user in the database.
     * @returns An array of all the users.
     */
    async getAllUsers(): Promise<Array<User>> {
        const users = await this.userRepository.find({
            select: ["id", "name", "email", "role", "createdAt", "updatedAt"],
        });
        return users;
    }

    /**
     * Update user informations. Can be use to update email address, username and permission of a specific user.
     * @param id userId.
     * @param newData New data for the user (name, email and role).
     * @returns
     */
    async updateUser(
        id: number,
        newData: { name: string; email: string; role: string }
    ): Promise<User> {
        const userToUpdate = await this.getUserById(id);
        const { email, name, role } = newData;
        if (email) userToUpdate.email = email;
        if (name) userToUpdate.name = name;
        if (role) userToUpdate.role = toRole(role);

        this.userRepository.save(userToUpdate);
        return userToUpdate;
    }

    /**
     * Change the user found by the specified id to the new password.
     * Only work if oldPassword correspond to the user current password and if oldPassword and newPassword are different.
     * @param id userId.
     * @param oldPassword Password used to verify user identity.
     * @param newPassword New password.
     * @returns User with updated informations.
     */
    async updatePassword(
        id: number,
        oldPassword: string,
        newPassword: string
    ): Promise<User> {
        if (oldPassword === newPassword) {
            throw new AppError(
                "New password cannot be the same as old one.",
                405
            );
        }
        const userToUpdate = await this.getUserById(id);
        const isPasswordValid = await bcrypt.compare(
            oldPassword,
            userToUpdate.password
        );
        if (!isPasswordValid) {
            throw new AppError("Incorrect password.", 401);
        }
        if (!this.passwordRegex.test(newPassword)) {
            throw new AppError("Invalid password format.", 400);
        }

        const hash = await bcrypt.hash(newPassword, 10);

        userToUpdate.password = hash;

        return this.userRepository.save(userToUpdate);
    }

    /**
     * Delete an user from the database by its id.
     * @param id userId.
     * @returns True if the user is deleted.
     */
    async deleteUserById(id: number): Promise<boolean> {
        const userToDelete = await this.getUserById(id);
        this.userRepository.delete(userToDelete.id);
        return true;
    }

    /**
     * Delete an user by its id but check if the password is correct before hand.
     * @param id userId.
     * @param password User password.
     * @returns True is the user is deleted.
     */
    async deleteUser(id: number, password: string): Promise<boolean> {
        const userToDelete = await this.getUserById(id);

        if (await bcrypt.compare(password, userToDelete.password)) {
            await this.userRepository.delete(userToDelete.id);
            return true;
        } else {
            throw new AppError(
                "Cannot delete user account : Incorrect password.",
                401
            );
        }
    }
}

export const userService = UserService.getInstance();