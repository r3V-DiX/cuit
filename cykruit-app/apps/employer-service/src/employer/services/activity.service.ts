import { Injectable } from '@nestjs/common';
import { ActivityRepository, ActivityQuery } from '../repositories/activity.repository';

@Injectable()
export class ActivityService {
    constructor(private readonly activityRepository: ActivityRepository) {}

    async getSystemLogs(userId: string, query: ActivityQuery) {
        const page  = query.page  ?? 1;
        const limit = query.limit ?? 50;
        const { items, total } = await this.activityRepository.findSystemLogs(userId, query);
        return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    async getAuthLogs(userId: string, query: ActivityQuery) {
        const page  = query.page  ?? 1;
        const limit = query.limit ?? 50;
        const { items, total } = await this.activityRepository.findAuthLogs(userId, query);
        return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }
}
