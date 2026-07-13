import { IsEnum } from 'class-validator';
import { WorkspaceType } from 'src/generated/prisma/enums';

export class WorkspaceStepDto {
  @IsEnum(WorkspaceType)
  workspaceType: WorkspaceType;
}
