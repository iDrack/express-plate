import "reflect-metadata";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { AppDataSource } from "./config/database.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import UserRoutes from "./routes/UserRoutes.js";
import { swaggerSpec } from "./config/swagger.js";

dotenv.config({ path: "./.env" });

const app = express();
const port = process.env.PORT;

app.use(express.json({ limit: "10kb" }));

app.use(cookieParser());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/users", UserRoutes);

app.use(errorHandler);

AppDataSource.initialize()
    .then(() => {
        console.log("Database connected successfully.");
        app.listen(port, () => {
            console.log(
                `Server running on port ${port} in ${process.env.MODE} mode`
            );
            console.log(
                `Swagger docs available at http://localhost:${port}/api-docs`
            );
        });
    })
    .catch((error) => {
        console.error("Error connecting to database:", error);
        process.exit(1);
    });

export { app };
