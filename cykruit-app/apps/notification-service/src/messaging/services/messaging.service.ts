// apps/notification-service/src/messaging/services/messaging.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { MessagingRepository } from '../repositories/messaging.repository';

@Injectable()
export class MessagingService {
    constructor(private readonly messagingRepository: MessagingRepository) {}

    // ── List conversations ────────────────────────────────────────────────────

    async getConversations(userId: string) {
        const conversations = await this.messagingRepository.findConversationsByUser(userId);

        return conversations.map((conv: any) => this.formatConversationSummary(conv, userId));
    }

    // ── Get single conversation ───────────────────────────────────────────────

    async getConversation(userId: string, conversationId: string) {
        const conversation = await this.messagingRepository.findConversationById(
            conversationId,
            userId,
        );

        if (!conversation) {
            throw new NotFoundException('CONVERSATION_NOT_FOUND');
        }

        return this.formatConversationDetail(conversation, userId);
    }

    // ── Start a conversation ──────────────────────────────────────────────────

    async startConversation(userId: string, targetUserId: string, jobId?: string) {
        // Current user is the initiator; determine seeker/employer from context.
        // We pass userId as seekerId and targetUserId as employerId — the repository
        // reads actual roles from the DB to set participant.role correctly.
        const conversation = await this.messagingRepository.findOrCreateConversation(
            userId,
            targetUserId,
            jobId,
        );

        return this.formatConversationSummary(conversation as any, userId);
    }

    // ── Send a message ────────────────────────────────────────────────────────

    async sendMessage(userId: string, conversationId: string, content: string) {
        // Verify user is a participant before sending
        const conversation = await this.messagingRepository.findConversationById(
            conversationId,
            userId,
        );

        if (!conversation) {
            throw new NotFoundException('CONVERSATION_NOT_FOUND');
        }

        const message = await this.messagingRepository.createMessage(
            conversationId,
            userId,
            content,
        );

        return this.formatMessage(message as any);
    }

    // ── Mark conversation as read ─────────────────────────────────────────────

    async markRead(userId: string, conversationId: string) {
        const conversation = await this.messagingRepository.findConversationById(
            conversationId,
            userId,
        );

        if (!conversation) {
            throw new NotFoundException('CONVERSATION_NOT_FOUND');
        }

        await this.messagingRepository.markConversationRead(conversationId, userId);
        return { message: 'Conversation marked as read' };
    }

    // ── Delete a message ──────────────────────────────────────────────────────

    async deleteMessage(userId: string, conversationId: string, messageId: string) {
        // Verify user is a participant in this conversation
        const conversation = await this.messagingRepository.findConversationById(
            conversationId,
            userId,
        );

        if (!conversation) {
            throw new NotFoundException('CONVERSATION_NOT_FOUND');
        }

        await this.messagingRepository.deleteMessage(messageId, userId);
        return { message: 'Message deleted' };
    }

    // ── Private formatting helpers ────────────────────────────────────────────

    private formatConversationSummary(conversation: any, userId: string) {
        const myParticipant = conversation.participants?.find(
            (p: any) => p.userId === userId,
        );

        return {
            id: conversation.id,
            jobId: conversation.jobId,
            lastMessageAt: conversation.lastMessageAt,
            lastMessagePreview: conversation.lastMessagePreview,
            participants: this.formatParticipants(conversation.participants),
            myUnread: myParticipant?.unreadCount ?? 0,
            lastMessage: conversation.messages?.[0]
                ? this.formatMessage(conversation.messages[0])
                : null,
        };
    }

    private formatConversationDetail(conversation: any, userId: string) {
        const myParticipant = conversation.participants?.find(
            (p: any) => p.userId === userId,
        );

        return {
            id: conversation.id,
            jobId: conversation.jobId,
            lastMessageAt: conversation.lastMessageAt,
            lastMessagePreview: conversation.lastMessagePreview,
            participants: this.formatParticipants(conversation.participants),
            myUnread: myParticipant?.unreadCount ?? 0,
            messages: (conversation.messages ?? []).map((m: any) => this.formatMessage(m)),
        };
    }

    private formatParticipants(participants: any[]) {
        return (participants ?? []).map((p: any) => ({
            userId: p.userId,
            role: p.role,
            unreadCount: p.unreadCount,
            lastReadAt: p.lastReadAt,
            user: p.user
                ? {
                      id: p.user.id,
                      firstName: p.user.firstName,
                      lastName: p.user.lastName,
                      email: p.user.email,
                      role: p.user.role,
                      profileImage: p.user.profileImage,
                  }
                : null,
        }));
    }

    private formatMessage(message: any) {
        return {
            id: message.id,
            senderId: message.senderId,
            content: message.encryptedContent,
            createdAt: message.createdAt,
            type: message.type,
        };
    }
}
