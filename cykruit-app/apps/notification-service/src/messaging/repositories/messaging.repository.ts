// apps/notification-service/src/messaging/repositories/messaging.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import type { Conversation, Message } from '@prisma/client';

@Injectable()
export class MessagingRepository {
    constructor(private readonly prisma: PrismaService) {}

    // ── List conversations for a user ─────────────────────────────────────────

    async findConversationsByUser(userId: string): Promise<Conversation[]> {
        return this.prisma.conversation.findMany({
            where: {
                isArchived: false,
                participants: {
                    some: { userId },
                },
            },
            orderBy: { lastMessageAt: 'desc' },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                role: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                messages: {
                    where: { isDeleted: false },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        }) as any;
    }

    // ── Get single conversation (with all messages) ───────────────────────────

    async findConversationById(id: string, userId: string): Promise<Conversation | null> {
        return this.prisma.conversation.findFirst({
            where: {
                id,
                participants: {
                    some: { userId },
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                role: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                messages: {
                    where: { isDeleted: false },
                    orderBy: { createdAt: 'asc' },
                },
            },
        }) as any;
    }

    // ── Find or create a conversation between two users ───────────────────────

    async findOrCreateConversation(
        seekerId: string,
        employerId: string,
        jobId?: string,
    ): Promise<Conversation> {
        // Find existing conversation where both are participants and jobId matches
        const existing = await this.prisma.conversation.findFirst({
            where: {
                jobId: jobId ?? null,
                participants: {
                    some: { userId: seekerId },
                },
                AND: {
                    participants: {
                        some: { userId: employerId },
                    },
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                role: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                messages: {
                    where: { isDeleted: false },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        if (existing) return existing as any;

        // Look up roles for both users to assign correct UserRole
        const [seekerUser, employerUser] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: seekerId }, select: { role: true } }),
            this.prisma.user.findUnique({ where: { id: employerId }, select: { role: true } }),
        ]);

        return this.prisma.conversation.create({
            data: {
                jobId: jobId ?? null,
                participants: {
                    create: [
                        { userId: seekerId, role: seekerUser?.role ?? 'SEEKER' },
                        { userId: employerId, role: employerUser?.role ?? 'EMPLOYER' },
                    ],
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                role: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                messages: {
                    where: { isDeleted: false },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        }) as any;
    }

    // ── Create a message ──────────────────────────────────────────────────────

    async createMessage(
        conversationId: string,
        senderId: string,
        content: string,
    ): Promise<Message> {
        const [message] = await this.prisma.$transaction([
            // 1. Create the message
            this.prisma.message.create({
                data: {
                    conversationId,
                    senderId,
                    encryptedContent: content,
                    type: 'text',
                },
            }),

            // 2. Update lastMessageAt + lastMessagePreview on conversation
            this.prisma.conversation.update({
                where: { id: conversationId },
                data: {
                    lastMessageAt: new Date(),
                    lastMessagePreview: content.slice(0, 100),
                },
            }),

            // 3. Increment unreadCount for all OTHER participants
            this.prisma.conversationParticipant.updateMany({
                where: {
                    conversationId,
                    userId: { not: senderId },
                },
                data: {
                    unreadCount: { increment: 1 },
                },
            }),

            // 4. Reset sender's unreadCount to 0 and update lastReadAt
            this.prisma.conversationParticipant.updateMany({
                where: {
                    conversationId,
                    userId: senderId,
                },
                data: {
                    unreadCount: 0,
                    lastReadAt: new Date(),
                },
            }),
        ]);

        return message;
    }

    // ── Mark conversation as read for a user ──────────────────────────────────

    async markConversationRead(conversationId: string, userId: string): Promise<void> {
        await this.prisma.conversationParticipant.updateMany({
            where: { conversationId, userId },
            data: {
                unreadCount: 0,
                lastReadAt: new Date(),
            },
        });
    }

    // ── Soft-delete a message ─────────────────────────────────────────────────

    async deleteMessage(messageId: string, userId: string): Promise<void> {
        await this.prisma.message.updateMany({
            where: {
                id: messageId,
                senderId: userId,
            },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: userId,
            },
        });
    }
}
