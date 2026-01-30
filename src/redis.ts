import { Redis } from "ioredis";
import { logger } from "./config/logger.js";

const redis = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
});

if (process.env.NODE_ENV !== "test") {
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
}

export default redis;
