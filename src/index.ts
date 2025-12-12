import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUI from "swagger-ui-express";
import dotenv from "dotenv";
import { json, urlencoded } from "body-parser";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(helmet());
app.use(morgan(process.env.MODE || "dev"));
app.use(json());
app.use(urlencoded({ extended: true }));

//Swagger UI

//Routes

//ERRORS handling

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
