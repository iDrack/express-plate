import { Logger } from "tslog";

export const logger = new Logger({
    name: "Log_1",
    minLevel:  process.env.NODE_ENV === "production" ? 2 : 0,
    type: "pretty",

    prettyLogTemplate: "{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}}\t{{logLevelName}}:\t",
    prettyErrorTemplate: "\n{{errorName}} {{errorMessage}}\nerror stack:\n{{errorStack}}",
    prettyErrorStackTemplate: "  • {{fileName}}\t{{method}}\n\t{{filePathWithLine}}",
    prettyErrorParentNamesSeparator: ":",
    prettyErrorLoggerNameDelimiter: "\t",
    stylePrettyLogs: true,
    prettyLogTimeZone: "local",
    
    // Masquer certains éléments
    hideLogPositionForProduction: process.env.NODE_ENV === "production",
    
});

//TODO: créer un middleware de log pour intercepter les requêtes http et donner leur réponse. 
//TODO: Rendre configurable le logger avec le niveau de log LOG_LEVEL
//TODO: Trouver un moyen d'enregistrer les logs, aussi paramétrable