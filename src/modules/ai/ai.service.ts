import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AIService {
  constructor(private readonly prisma: PrismaService) {}

  listModels() {
    return this.prisma.aIModel.findMany({ where: { isAvailable: true }, orderBy: { name: 'asc' } });
  }

  async createAgent(input: { workspaceId: string; createdBy: string; name: string; slug: string; systemPrompt: string; description?: string }) {
    await this.ensureWorkspace(input.workspaceId);
    await this.ensureUser(input.createdBy);
    return this.prisma.aIAgent.create({ data: input });
  }

  async listAgents(workspaceId: string) {
    await this.ensureWorkspace(workspaceId);
    return this.prisma.aIAgent.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });
  }

  async createConversation(input: { workspaceId: string; userId: string; title: string; agentId?: string }) {
    await this.ensureWorkspace(input.workspaceId);
    await this.ensureUser(input.userId);
    if (input.agentId) {
      const agent = await this.prisma.aIAgent.findFirst({ where: { id: input.agentId, workspaceId: input.workspaceId, deletedAt: null } });
      if (!agent) throw new NotFoundException('Agent not found in this workspace');
    }
    return this.prisma.conversation.create({ data: input });
  }

  async addMessage(conversationId: string, input: { role: MessageRole; content: string; modelId?: string; metadata?: Record<string, unknown> }) {
    const conversation = await this.prisma.conversation.findFirst({ where: { id: conversationId, deletedAt: null } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (input.modelId) await this.ensureModel(input.modelId);
    return this.prisma.$transaction(async (tx) => {
      const { metadata, ...messageInput } = input;
      const message = await tx.message.create({
        data: {
          conversationId,
          ...messageInput,
          ...(metadata === undefined ? {} : { metadata: metadata as Prisma.InputJsonValue }),
        },
      });
      await tx.conversation.update({ where: { id: conversationId }, data: { messageCount: { increment: 1 } } });
      return message;
    });
  }

  async getConversation(id: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, deletedAt: null },
      include: { messages: { orderBy: { createdAt: 'asc' } }, agent: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  private async ensureWorkspace(id: string) {
    const workspace = await this.prisma.workspace.findFirst({ where: { id, deletedAt: null } });
    if (!workspace) throw new NotFoundException('Workspace not found');
  }

  private async ensureUser(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');
  }

  private async ensureModel(id: string) {
    const model = await this.prisma.aIModel.findFirst({ where: { id, isAvailable: true } });
    if (!model) throw new NotFoundException('AI model not found or unavailable');
  }
}
