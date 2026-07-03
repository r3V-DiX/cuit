// libs/upload/upload.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadService } from './upload.service';
import uploadConfig from './upload.config';

@Global()
@Module({
    imports: [ConfigModule.forFeature(uploadConfig)],
    providers: [UploadService],
    exports: [UploadService],
})
export class UploadModule { }