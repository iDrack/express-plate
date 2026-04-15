import "reflect-metadata";
import { Container } from "typedi";
import cors from 'cors';
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { AppDataSource } from "./config/database.js";
import { logger } from "./config/logger.js";
import { swaggerSpec } from "./config/swagger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { httpLogger } from "./middlewares/httpLogger.js";
import HealthRoutes from "./modules/health/health.routes.js";
import UserRoutes from "./modules/user/user.routes.js";
import FileTransfertRoute from "./modules/transfert/transfert.routes.js";
import { UserController } from "./modules/user/user.controller.js";

const app = express();
dotenv.config({ path: "./.env" });
const port = process.env.PORT;

app.use(express.json({ limit: "10kb" }));

//Cors
const client_port = process.env.CLIENT_URL?.split(':')[1] || '3000';
app.use(cors({
  origin: [`http://localhost:${client_port}`, `http://127.0.0.1:${client_port}`],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

//Cookies
app.use(cookieParser());

//Swagger
if (process.env.NODE_ENV !== "production")
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//Logging
if (logger.settings.minLevel <= 1) {
    app.use(httpLogger);
}

//Headers
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

//Routes
app.use("/users", UserRoutes);
app.use("/health", HealthRoutes);
app.use("/file", FileTransfertRoute);

//Errors handling
app.use(errorHandler);

AppDataSource.initialize()
    .then(() => {
        logger.info("Database connected successfully.");
        app.listen(port, () => {
            logger.info(
                `Server running on port ${port} in ${process.env.NODE_ENV} mode`,
            );
            if (process.env.NODE_ENV !== "production") {
                logger.info(
                    `Swagger docs available at http://localhost:${port}/api-docs`,
                );
            }
        });
    })
    .catch((error) => {
        logger.error("Error connecting to database:", error);
        process.exit(1);
    });

export { app };
