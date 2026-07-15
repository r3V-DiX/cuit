import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KycRepository } from './kyc.repository';

@Module({
    controllers: [KycController],
    providers: [KycService, KycRepository],
})
export class KycModule {}
