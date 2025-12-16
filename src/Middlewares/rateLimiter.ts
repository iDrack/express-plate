import rateLimit from "express-rate-limit";

//100 requêtes/15min
export const apiLimiter = rateLimit({
    windowMs: 15*60*1000,
    max: 100,
    message: {
        status: "fail",
        message: "Trop de requête. Veuillez réessayer plus tard."
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
        message: "Trop de compte créer depuis cette IP. Veuillez réessayer plus tard."
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
        message: "Trop de tentatives de connexion. Veuillez réessayer plus tard."
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
        message: "Trop de tentatives de rafraîchissement. Veuillez réessayer plus tard."
    },
    standardHeaders: true,
    legacyHeaders: false,
});