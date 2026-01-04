import { Logger } from "tslog";
import * as fs from "fs";
import * as path from "path";

export const logger = new Logger({
    name: "Log_1",
    minLevel:  process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : process.env.NODE_ENV === "production" ? 2 : 0,
    type: "pretty",

    prettyLogTemplate: "{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}}\t{{logLevelName}}:\t",
    prettyErrorTemplate: "\n{{errorName}} {{errorMessage}}\nerror stack:\n{{errorStack}}",
    prettyErrorStackTemplate: "  • {{fileName}}\t{{method}}\n\t{{filePathWithLine}}",
    prettyErrorParentNamesSeparator: ":",
    prettyErrorLoggerNameDelimiter: "\t",
    stylePrettyLogs: true,
    prettyLogTimeZone: "local",
    
    hideLogPositionForProduction: process.env.NODE_ENV === "production",
});

//Log entries sorted by day, format: app-YYYY-MM-DD.log
if (process.env.LOG_PERSIST === 'true') {
    const logDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true});
    }
    
    const logStream = fs.createWriteStream(
        path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`),
        { flags: "a" }
    );
    
    const errorStream = fs.createWriteStream(
        path.join(logDir, `error-${new Date().toISOString().split('T')[0]}.log`),
        {flags: 'a'}
    );
    
    logger.attachTransport((logObj) => {
        logStream.write(JSON.stringify(logObj) + "\n");
    
        if(logObj._meta?.logLevelId !== undefined && logObj._meta?.logLevelId >= 4) {
            errorStream.write(JSON.stringify(logObj) + "\n")
        }
    });
}