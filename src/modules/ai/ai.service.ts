import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AIService {
  constructor(private readonly prisma: PrismaService) {}

  listModels() {
    return this.prisma.aIModel.findMany({ where: { isAvailable: true }, orderBy: { name: 'asc' } });
  }

  async createAgent(input: {
    workspaceId: string;
    createdBy: string;
    name: string;
    slug: string;
    systemPrompt: string;
    description?: string;
  }) {
    await this.ensureWorkspace(input.workspaceId);
    return this.prisma.aIAgent.create({ data: input });
  }

  listAgents(workspaceId: string) {
    return this.prisma.aIAgent.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });
  }

  async createConversation(input: { workspaceId: string; userId: string; title: string; agentId?: string }) {
    await this.ensureWorkspace(input.workspaceId);
    if (input.agentId) {
      const agent = await this.prisma.aIAgent.findFirst({ where: { id: input.agentId, workspaceId: input.workspaceId, deletedAt: null } });
      if (!agent) throw new NotFoundException('Agent not found in this workspace');
    }
    return this.prisma.conversation.create({ data: input });
  }

  async addMessage(conversationId: string, input: { role: any; content: string; modelId?: string; metadata?: any }) {
    const conversation = await this.prisma.conversation.findFirst({ where: { id: conversationId, deletedAt: null } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({ data: { conversationId, ...input } });
      await tx.conversation.update({ where: { id: conversationId }, data: { messageCount: { increment: 1 } } });
      return message;
    });
  }

  getConversation(id: string) {
    return this.prisma.conversation.findFirst({
      where: { id, deletedAt: null },
      include: { messages: { orderBy: { createdAt: 'asc' } }, agent: true },
    });
  }

  private async ensureWorkspace(id: string) {
    const workspace = await this.prisma.workspace.findFirst({ where: { id, deletedAt: null } });
    if (!workspace) throw new NotFoundException('Workspace not found');
  }
}
