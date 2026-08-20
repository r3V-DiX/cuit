// admin-app/src/modules/applications/applications.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationsRepository } from './applications.repository';
import { AdminApplicationListQueryDto } from './dto/applications.dto';

@Injectable()
export class ApplicationsService {
    constructor(private readonly applicationsRepository: ApplicationsRepository) {}

    async list(query: AdminApplicationListQueryDto) {
        return this.applicationsRepository.findAll(query);
    }

    async getById(id: string) {
        const application = await this.applicationsRepository.findById(id);
        if (!application) throw new NotFoundException('Application not found');
        return application;
    }
}
