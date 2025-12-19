import rateLimit from "express-rate-limit";

//100 requêtes/15min
export const apiLimiter = rateLimit({
    windowMs: 15*60*1000,
    max: 100,
    message: {
        status: "fail",
        message: "Too many requests, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

//Limite de création de compte
export const registerLimiter = rateLimit({
    windowMs: 60*1000,
    max: 2,
    message: {
        status: "fail",
        message: "Too many register attempts, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

//limite les tentative de connexion
export const loginLimiter = rateLimit({
    windowMs: 5*60*1000,
    max: 5,
    message: {
        status: "fail",
        message: "Too many login attempts, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});


//Limite le refresh du token
export const refreshLimiter = rateLimit({
    windowMs: 15*60*1000,
    max: 10,
    message: {
        status: "fail",
        message: "Too many refresh attempts, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});