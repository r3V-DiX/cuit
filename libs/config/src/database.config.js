"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// libs/config/database.config.ts
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)("database", () => ({
    url: process.env.DATABASE_URL,
}));
