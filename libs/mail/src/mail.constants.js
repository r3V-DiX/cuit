"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAIL_QUEUE = exports.EmailType = void 0;
// libs/mail/mail.constants.ts
var EmailType;
(function (EmailType) {
    EmailType["VERIFICATION"] = "VERIFICATION";
    EmailType["PASSWORD_RESET"] = "PASSWORD_RESET";
    EmailType["PASSWORD_CHANGED"] = "PASSWORD_CHANGED";
    EmailType["NOTIFICATION"] = "NOTIFICATION";
})(EmailType || (exports.EmailType = EmailType = {}));
exports.MAIL_QUEUE = "notification-emails";
