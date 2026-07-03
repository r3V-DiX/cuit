"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSuccessResponse = isSuccessResponse;
exports.isErrorResponse = isErrorResponse;
exports.hasWarning = hasWarning;
exports.hasInfo = hasInfo;
function isSuccessResponse(response) {
    return response.success === true;
}
function isErrorResponse(response) {
    return response.success === false;
}
function hasWarning(response) {
    return response.success === true && "warning" in response;
}
function hasInfo(response) {
    return response.success === true && "info" in response;
}
