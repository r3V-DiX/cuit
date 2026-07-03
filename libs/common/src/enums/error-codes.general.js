"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalServiceErrorCodes = exports.ValidationErrorCodes = exports.DatabaseErrorCodes = exports.GeneralErrorCodes = void 0;
// libs/common/enums/error-codes.general.ts
var GeneralErrorCodes;
(function (GeneralErrorCodes) {
    GeneralErrorCodes["BAD_REQUEST"] = "BAD_REQUEST";
    GeneralErrorCodes["UNAUTHORIZED"] = "UNAUTHORIZED";
    GeneralErrorCodes["FORBIDDEN"] = "FORBIDDEN";
    GeneralErrorCodes["NOT_FOUND"] = "NOT_FOUND";
    GeneralErrorCodes["CONFLICT"] = "CONFLICT";
    GeneralErrorCodes["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    GeneralErrorCodes["UNPROCESSABLE_ENTITY"] = "UNPROCESSABLE_ENTITY";
    GeneralErrorCodes["TOO_MANY_REQUESTS"] = "TOO_MANY_REQUESTS";
    GeneralErrorCodes["REQUEST_TIMEOUT"] = "REQUEST_TIMEOUT";
    GeneralErrorCodes["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
    GeneralErrorCodes["BAD_GATEWAY"] = "BAD_GATEWAY";
    GeneralErrorCodes["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    GeneralErrorCodes["GATEWAY_TIMEOUT"] = "GATEWAY_TIMEOUT";
})(GeneralErrorCodes || (exports.GeneralErrorCodes = GeneralErrorCodes = {}));
var DatabaseErrorCodes;
(function (DatabaseErrorCodes) {
    DatabaseErrorCodes["DATABASE_CONNECTION_FAILED"] = "DATABASE_CONNECTION_FAILED";
    DatabaseErrorCodes["DUPLICATE_ENTRY"] = "DUPLICATE_ENTRY";
    DatabaseErrorCodes["FOREIGN_KEY_CONSTRAINT"] = "FOREIGN_KEY_CONSTRAINT";
    DatabaseErrorCodes["TRANSACTION_FAILED"] = "TRANSACTION_FAILED";
    DatabaseErrorCodes["QUERY_TIMEOUT"] = "QUERY_TIMEOUT";
})(DatabaseErrorCodes || (exports.DatabaseErrorCodes = DatabaseErrorCodes = {}));
var ValidationErrorCodes;
(function (ValidationErrorCodes) {
    ValidationErrorCodes["INVALID_EMAIL_FORMAT"] = "INVALID_EMAIL_FORMAT";
    ValidationErrorCodes["INVALID_PHONE_FORMAT"] = "INVALID_PHONE_FORMAT";
    ValidationErrorCodes["INVALID_URL_FORMAT"] = "INVALID_URL_FORMAT";
    ValidationErrorCodes["INVALID_DATE_RANGE"] = "INVALID_DATE_RANGE";
    ValidationErrorCodes["REQUIRED_FIELD_MISSING"] = "REQUIRED_FIELD_MISSING";
    ValidationErrorCodes["VALUE_TOO_SHORT"] = "VALUE_TOO_SHORT";
    ValidationErrorCodes["VALUE_TOO_LONG"] = "VALUE_TOO_LONG";
    ValidationErrorCodes["INVALID_ENUM_VALUE"] = "INVALID_ENUM_VALUE";
    ValidationErrorCodes["INVALID_UUID"] = "INVALID_UUID";
})(ValidationErrorCodes || (exports.ValidationErrorCodes = ValidationErrorCodes = {}));
var ExternalServiceErrorCodes;
(function (ExternalServiceErrorCodes) {
    ExternalServiceErrorCodes["EMAIL_SERVICE_UNAVAILABLE"] = "EMAIL_SERVICE_UNAVAILABLE";
    ExternalServiceErrorCodes["EMAIL_SEND_FAILED"] = "EMAIL_SEND_FAILED";
    ExternalServiceErrorCodes["SMS_SERVICE_UNAVAILABLE"] = "SMS_SERVICE_UNAVAILABLE";
    ExternalServiceErrorCodes["SMS_SEND_FAILED"] = "SMS_SEND_FAILED";
    ExternalServiceErrorCodes["STORAGE_SERVICE_UNAVAILABLE"] = "STORAGE_SERVICE_UNAVAILABLE";
    ExternalServiceErrorCodes["THIRD_PARTY_API_ERROR"] = "THIRD_PARTY_API_ERROR";
})(ExternalServiceErrorCodes || (exports.ExternalServiceErrorCodes = ExternalServiceErrorCodes = {}));
