import { Redis } from "ioredis";
import { logger } from "./config/logger.js";

const redis = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
});

redis.on("connect", () => {
    logger.info("Redis client connected");
});

redis.on("ready", () => {
    logger.info("Redis client ready");
});

redis.on("error", (err) => {
    logger.error("Redis client error:", err);
});

redis.on("close", () => {
    logger.warn("Redis client connection closed");
});

redis.on("reconnecting", () => {
    logger.warn("Redis client reconnecting...");
});

export default redis;

//TODO: Ajouter un module d'envoie de mail
//TODO: Ajouter un service qui génère un url et un mail pour reset un mdp
//TODO: Créer une route pour gérer la demande de reset de mdp (avec JWT temporaire et enregistré dans redis)
//TODO: Créer une route et service pour gérer la mise à jour d'un mdp reset (mettre à jour le JWT temp dans redis)