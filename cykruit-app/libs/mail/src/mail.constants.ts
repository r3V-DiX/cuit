// libs/mail/mail.constants.ts
export enum EmailType {
    VERIFICATION = 'VERIFICATION',
    PASSWORD_RESET = 'PASSWORD_RESET',
    PASSWORD_CHANGED = 'PASSWORD_CHANGED',
    NOTIFICATION = 'NOTIFICATION',
}

export const MAIL_QUEUE = 'notification-emails';