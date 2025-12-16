import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../models/User.js";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USER!,
    password: process.env.DATABASE_PASSWORD!,
    database: process.env.DATABASE_NAME!,
    synchronize: process.env.MODE === "dev",
    logging: false,
    entities: [User],
    migrations: ["src/migration/**/*.ts"],
});
