import { MessageRole } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAgentDto {
  @IsString() @IsNotEmpty() workspaceId!: string;
  @IsString() @IsNotEmpty() createdBy!: string;
  @IsString() @IsNotEmpty() @MaxLength(120) name!: string;
  @IsString() @IsNotEmpty() @MaxLength(120) slug!: string;
  @IsString() @IsNotEmpty() systemPrompt!: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
}

export class CreateConversationDto {
  @IsString() @IsNotEmpty() workspaceId!: string;
  @IsString() @IsNotEmpty() userId!: string;
  @IsString() @IsNotEmpty() @MaxLength(240) title!: string;
  @IsOptional() @IsString() agentId?: string;
}

export class AddMessageDto {
  @IsEnum(MessageRole) role!: MessageRole;
  @IsString() @IsNotEmpty() content!: string;
  @IsOptional() @IsString() modelId?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}
