import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, WorkflowExecutionStatus, WorkflowStatus, WorkflowTriggerType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: { workspaceId: string; createdBy: string; name: string; slug: string; description?: string; definition: string; triggerType?: WorkflowTriggerType; cronExpression?: string }) {
    await this.ensureWorkspace(input.workspaceId);
    await this.ensureUser(input.createdBy);
    return this.prisma.workflow.create({ data: input });
  }

  async list(workspaceId: string) {
    await this.ensureWorkspace(workspaceId);
    return this.prisma.workflow.findMany({ where: { workspaceId, deletedAt: null }, orderBy: { updatedAt: 'desc' } });
  }

  async publish(id: string) {
    const workflow = await this.prisma.workflow.findFirst({ where: { id, deletedAt: null } });
    if (!workflow) throw new NotFoundException('Workflow not found');
    return this.prisma.workflow.update({ where: { id }, data: { status: WorkflowStatus.PUBLISHED } });
  }

  async execute(id: string, input?: Record<string, unknown>) {
    const workflow = await this.prisma.workflow.findFirst({ where: { id, deletedAt: null, isActive: true } });
    if (!workflow) throw new NotFoundException('Workflow not found or inactive');
    if (workflow.status !== WorkflowStatus.PUBLISHED) throw new NotFoundException('Workflow is not published');
    return this.prisma.workflowExecution.create({
      data: {
        workflowId: id,
        status: WorkflowExecutionStatus.PENDING,
        ...(input === undefined ? {} : { input: input as Prisma.InputJsonValue }),
      },
    });
  }

  private async ensureWorkspace(id: string) {
    const workspace = await this.prisma.workspace.findFirst({ where: { id, deletedAt: null } });
    if (!workspace) throw new NotFoundException('Workspace not found');
  }
  private async ensureUser(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');
  }
}
