// admin-app/src/modules/blogs/blogs.module.ts

import { Module } from '@nestjs/common';
import { BlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';
import { BlogsRepository } from './blogs.repository';

@Module({
    controllers: [BlogsController],
    providers: [BlogsService, BlogsRepository],
    exports: [BlogsService, BlogsRepository],
})
export class BlogsModule {}
