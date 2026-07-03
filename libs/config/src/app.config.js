"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// libs/config/app.config.ts
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)("app", () => ({
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "3000", 10),
    appUrl: process.env.APP_URL || "http://localhost:3000",
    apiUrl: process.env.API_URL || "http://localhost:4000",
    corsOrigins: process.env.CORS_ORIGINS?.split(",") || [
        "http://localhost:3000",
    ],
    logLevel: process.env.LOG_LEVEL || "log",
}));
