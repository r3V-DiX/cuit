// apps/notification-service/src/messaging/dto/messaging.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class SendMessageDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    content: string;
}

export class StartConversationDto {
    @IsUUID()
    targetUserId: string;

    @IsOptional()
    @IsUUID()
    jobId?: string;
}
