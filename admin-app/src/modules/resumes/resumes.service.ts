// admin-app/src/modules/resumes/resumes.service.ts

import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
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

    // Streams the file through this endpoint instead of returning a presigned
    // URL — the browser only ever sees this admin-app route (auth-gated), never
    // a bearer-style S3 URL with its signature sitting in the address bar.
    async getFileStream(id: string): Promise<StreamableFile> {
        const resume = await this.resumesRepository.findFileUrlById(id);
        if (!resume) throw new NotFoundException('Resume not found');

        const { stream, contentType, contentLength } = await this.uploadService.getFileStream(resume.fileUrl);
        return new StreamableFile(stream, {
            type: contentType ?? 'application/octet-stream',
            disposition: `inline; filename="${resume.fileName ?? 'resume.pdf'}"`,
            length: contentLength,
        });
    }
}
