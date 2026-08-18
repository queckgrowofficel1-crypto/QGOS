import { IsArray, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateAutomationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsIn(['DRAFT', 'ACTIVE', 'PAUSED'])
  status!: 'DRAFT' | 'ACTIVE' | 'PAUSED';

  @IsString()
  @IsNotEmpty()
  trigger!: string;

  @IsArray()
  @IsString({ each: true })
  actions!: string[];
}
