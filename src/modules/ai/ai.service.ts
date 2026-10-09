import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AIService {
  constructor(private readonly prisma: PrismaService) {}

  listModels() {
    return this.prisma.aIModel.findMany({ where: { isAvailable: true }, orderBy: { name: 'asc' } });
  }

  async getArmyReadiness(workspaceId: string) {
    await this.ensureWorkspace(workspaceId);
    const [agents, availableModels] = await Promise.all([
      this.prisma.aIAgent.findMany({
        where: { workspaceId, deletedAt: null },
        select: { status: true },
      }),
      this.prisma.aIModel.count({ where: { isAvailable: true } }),
    ]);

    const activeAgents = agents.filter((agent) => agent.status === 'ACTIVE').length;
    const testingAgents = agents.filter((agent) => agent.status === 'TESTING').length;
    const draftAgents = agents.filter((agent) => agent.status === 'DRAFT').length;
    const provider = process.env.AI_PROVIDER?.toLowerCase();
    const providerConfigured = provider === 'openai' && Boolean(process.env.OPENAI_API_KEY);
    const blockers: string[] = [];

    if (activeAgents === 0) blockers.push('No ACTIVE AI agents are configured in this workspace');
    if (availableModels === 0) blockers.push('No available AI models are configured in the database');
    if (!providerConfigured) blockers.push('Runtime AI provider is missing, unsupported, or lacks its API key');
    blockers.push('External QueckGrow Job System integration is not verified');
    blockers.push('Workflow executions are queued as PENDING; a worker must process them before claiming autonomous execution');

    return {
      status: activeAgents > 0 && availableModels > 0 && providerConfigured ? 'CONFIGURED_WITH_INTEGRATION_BLOCKERS' : 'NOT_READY',
      workspaceId,
      agents: { total: agents.length, active: activeAgents, testing: testingAgents, draft: draftAgents },
      models: { available: availableModels },
      provider: { name: provider === 'openai' ? 'openai' : provider ? 'unsupported' : null, configured: providerConfigured },
      externalJobSystemConnected: false,
      autonomousWorkflowExecutionVerified: false,
      financialSideEffectsEnabledByThisAudit: false,
      blockers,
    };
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
