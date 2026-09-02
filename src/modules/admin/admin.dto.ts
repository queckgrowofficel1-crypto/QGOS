import { UserRole, UserStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

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
