// apps/seeker-profile-service/src/profile/dto/projects/update-project.dto.ts

import { PartialType } from "@nestjs/mapped-types";
import { CreateProjectDto } from "./create-project.dto";

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
