import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "TodoList API",
            version: "1.0.0",
            description: "API de gestion de tâches",
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT}`,
                description: "Serveur de développement",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "Bearer",
                    bearerFormat: "JWT",
                    description: "Entrez votre token JWT,"
                },
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "refreshToken",
                    description: "Cookie de refresh token"
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ["./src/Routes/*.ts", "./src/Models/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
