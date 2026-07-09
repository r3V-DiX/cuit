// apps/notification-service/src/messaging/dto/messaging.dto.ts

import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class SendMessageDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    content: string;
}

export class StartConversationDto {
    @IsString()
    @IsNotEmpty()
    targetUserId: string;

    @IsString()
    @IsOptional()
    jobId?: string;
}
