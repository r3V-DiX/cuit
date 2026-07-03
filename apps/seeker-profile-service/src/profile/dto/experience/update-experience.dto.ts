// apps/seeker-profile-service/src/profile/dto/experience/update-experience.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateExperienceDto } from './create-experience.dto';

export class UpdateExperienceDto extends PartialType(CreateExperienceDto) { }