import { IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class AssignReferrerDto {
  @IsString()
  @IsNotEmpty()
  referrerId!: string;
}

export class AssignReferralCodeDto {
  @IsString()
  @IsNotEmpty()
  referralCode!: string;
}

export class NetworkQueryDto {
  @IsOptional()
  @Min(1)
  @Max(10)
  depth?: number;
}
