import "reflect-metadata";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { AppDataSource } from "./config/database.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import UserRoutes from "./routes/UserRoutes.js";
import { swaggerSpec } from "./config/swagger.js";
import { httpLogger, logger } from "./config/logger.js";

const app = express();
const port = process.env.PORT;

dotenv.config({ path: "./.env" });

app.use(express.json({ limit: "10kb" }));

//Cookies
app.use(cookieParser());

//Swagger
if (process.env.NODE_ENV !== "production")
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//Logging
if (logger.settings.minLevel <= 1) {
    app.use(httpLogger);
}

//Routes
app.use("/users", UserRoutes);

//Errors handling
app.use(errorHandler);

AppDataSource.initialize()
    .then(() => {
        console.log("Database connected successfully.");
        app.listen(port, () => {
            if (process.env.NODE_ENV !== "production")
                logger.info(
                    `Server running on port ${port} in ${process.env.NODE_ENV} mode`
                );
            logger.info(
                `Swagger docs available at http://localhost:${port}/api-docs`
            ); /*  */
        });
    })
    .catch((error) => {
        logger.error("Error connecting to database:", error);
        process.exit(1);
    });

export { app };
