import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUI from "swagger-ui-express";
import dotenv from "dotenv";
import { urlencoded } from "body-parser";
import { AppDataSource } from "./config/ormConfig";
import { errorHandler } from "./middlewares/errorHandler";

dotenv.config({ path: "./.env" });

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(helmet());
app.use(morgan(process.env.MODE || "dev"));
app.use(express.json({ limit: "10kb" }));
app.use(urlencoded({ extended: true }));

//Swagger UI

//Routes

//ERRORS handling
app.use(errorHandler);

AppDataSource.initialize()
    .then(() => {
        console.log("Database connected successfully.");
        app.listen(port, () => {
            console.log(
                `Server running on port ${port} in ${process.env.MODE} mode`
            );
            console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
            
        });
    })
    .catch((error) => {
        console.error("Error connecting to database:", error);
        process.exit(1);
    });

export { app };
