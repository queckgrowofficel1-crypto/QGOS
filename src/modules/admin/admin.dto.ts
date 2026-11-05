import { AuditLogAction, UserRole, UserStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateUserAdminDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsString()
  actorId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class AdminWithdrawalDecisionDto {
  @IsString()
  actorId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class AdminAuditQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 25;

  @IsOptional()
  @IsString()
  entity?: string;

  @IsOptional()
  @IsEnum(AuditLogAction)
  action?: AuditLogAction;

  @IsOptional()
  @IsString()
  status?: string;
}
