import { IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';
import { TransactionType, WalletType } from '@prisma/client';

export class WalletOperationDto {
  @IsString() @IsNotEmpty() userId!: string;
  @IsEnum(WalletType) type!: WalletType;
  @IsString() @IsNotEmpty() @IsNumberString() amount!: string;
  @IsEnum(TransactionType) transactionType!: TransactionType;
  @IsString() @IsNotEmpty() @MaxLength(120) reference!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() @MaxLength(12) currency?: string;
}

export class CreateInvestmentDto {
  @IsString() @IsNotEmpty() userId!: string;
  @IsString() @IsNotEmpty() packageId!: string;
  @IsString() @IsNotEmpty() @IsNumberString() amount!: string;
  @IsEnum(WalletType) walletType!: WalletType;
  @IsString() @IsNotEmpty() @MaxLength(120) reference!: string;
  @IsOptional() @IsString() @MaxLength(12) currency?: string;
}
