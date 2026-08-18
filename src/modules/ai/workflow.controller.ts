import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { WorkflowTriggerType } from '@prisma/client';
import { WorkflowService } from './workflow.service';

class CreateWorkflowDto {
  @IsString() @IsNotEmpty() workspaceId!: string;
  @IsString() @IsNotEmpty() createdBy!: string;
  @IsString() @IsNotEmpty() @MaxLength(160) name!: string;
  @IsString() @IsNotEmpty() @MaxLength(160) slug!: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsString() @IsNotEmpty() definition!: string;
  @IsOptional() @IsEnum(WorkflowTriggerType) triggerType?: WorkflowTriggerType;
  @IsOptional() @IsString() cronExpression?: string;
}

@Controller('ai/workflows')
export class WorkflowController {
  constructor(private readonly workflows: WorkflowService) {}

  @Get()
  list(@Query('workspaceId') workspaceId: string) { return this.workflows.list(workspaceId); }

  @Post()
  create(@Body() body: CreateWorkflowDto) { return this.workflows.create(body); }

  @Post(':id/publish')
  publish(@Param('id') id: string) { return this.workflows.publish(id); }

  @Post(':id/execute')
  execute(@Param('id') id: string, @Body() body: { input?: Record<string, unknown> }) { return this.workflows.execute(id, body.input); }
}
