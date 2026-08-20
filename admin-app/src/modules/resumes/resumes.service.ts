// admin-app/src/modules/resumes/resumes.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { ResumesRepository } from './resumes.repository';
import { AdminResumeListQueryDto } from './dto/resumes.dto';
import { UploadService } from '@cykruit/upload';

@Injectable()
export class ResumesService {
    constructor(
        private readonly resumesRepository: ResumesRepository,
        private readonly uploadService: UploadService,
    ) {}

    async list(query: AdminResumeListQueryDto) {
        return this.resumesRepository.findAll(query);
    }

    async getViewUrl(id: string): Promise<{ url: string }> {
        const resume = await this.resumesRepository.findFileUrlById(id);
        if (!resume) throw new NotFoundException('Resume not found');
        const url = await this.uploadService.convertToPresignedUrl(resume.fileUrl);
        return { url };
    }
}
