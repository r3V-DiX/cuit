// apps/seeker-profile-service/src/profile/dto/ctf/update-ctf-profile.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateCTFProfileDto } from './create-ctf-profile.dto';

export class UpdateCTFProfileDto extends PartialType(CreateCTFProfileDto) { }