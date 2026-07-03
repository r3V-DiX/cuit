"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAIL_QUEUE = exports.EmailType = exports.MailService = exports.MailModule = void 0;
// libs/mail/index.ts
var mail_module_1 = require("./mail.module");
Object.defineProperty(exports, "MailModule", { enumerable: true, get: function () { return mail_module_1.MailModule; } });
var mail_service_1 = require("./mail.service");
Object.defineProperty(exports, "MailService", { enumerable: true, get: function () { return mail_service_1.MailService; } });
var mail_constants_1 = require("./mail.constants");
Object.defineProperty(exports, "EmailType", { enumerable: true, get: function () { return mail_constants_1.EmailType; } });
Object.defineProperty(exports, "MAIL_QUEUE", { enumerable: true, get: function () { return mail_constants_1.MAIL_QUEUE; } });
