export interface IRequestContext {
    requestId: string;
    userId?: string;
    email?: string;
    role?: string;
    ip: string;
    userAgent: string;
    path: string;
    method: string;
    timestamp: Date;
}
export interface IRequestUser {
    userId: string;
    email: string;
    role: string;
}
