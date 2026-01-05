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
    connectTimeoutMS: 5000, // Connection timeout :  5 secondes
    extra: {
        // connections pool
        max: 10,
        min: 2,
        idleTimeoutMillis: 30000, // Close inactive connection after 30sec
        connectionTimeoutMillis: 5000,
    },
    synchronize: process.env.NODE_ENV === "development",
    logging: false,
    entities: [User],
    migrations: ["src/migration/**/*.ts"],
});
