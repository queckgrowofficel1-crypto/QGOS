import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { MessageRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AIProviderService } from './ai-provider';

@Injectable()
export class AIService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiProvider: AIProviderService,
  ) {}

  listModels() {
    return this.prisma.aIModel.findMany({ where: { isAvailable: true }, orderBy: { name: 'asc' } });
  }

  async getArmyReadiness(workspaceId: string) {
    if (!workspaceId?.trim()) throw new BadRequestException('workspaceId query parameter is required');
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
    blockers.push('Live model inference must be verified with a staging conversation');
    blockers.push('External QueckGrow Job System API contract and staging integration are not verified');
    blockers.push('AI_AGENT_CALL, WEBHOOK, and DATA_FETCH workflow adapters are disabled; only deterministic local steps execute');
    blockers.push('Workflow execution is synchronous; durable queue, retry, timeout, and dead-letter handling are not configured');

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

  /**
   * Runs an explicitly selected, active agent against an explicitly selected available OpenAI LLM.
   * Only conversation USER/ASSISTANT messages are sent as history; caller-supplied SYSTEM messages are excluded.
   * This creates one assistant message and never invokes financial or external Job System actions.
   */
  async respondToConversation(conversationId: string, input: { modelId: string; temperature?: number }) {
    if (!input.modelId?.trim()) throw new BadRequestException('modelId is required');
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, deletedAt: null, status: 'ACTIVE' },
      include: {
        agent: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!conversation) throw new NotFoundException('Active conversation not found');
    if (!conversation.agent || conversation.agent.deletedAt || conversation.agent.status !== 'ACTIVE') {
      throw new BadRequestException('Conversation must be linked to an active AI agent');
    }

    const model = await this.prisma.aIModel.findFirst({
      where: { id: input.modelId, isAvailable: true, provider: 'OPENAI', type: 'LLM' },
    });
    if (!model) throw new NotFoundException('Selected model must be an available OpenAI LLM');
    if (process.env.AI_PROVIDER?.toLowerCase() !== 'openai' || !process.env.OPENAI_API_KEY) {
      throw new ServiceUnavailableException('OpenAI provider is not configured');
    }

    const history = conversation.messages
      .filter((message) => message.role === 'USER' || message.role === 'ASSISTANT')
      .reverse()
      .map((message) => ({ role: message.role === 'USER' ? 'user' : 'assistant', content: message.content }));

    if (history.length === 0 || history[history.length - 1].role !== 'user') {
      throw new BadRequestException('Add a user message before requesting an agent response');
    }

    const completion = await this.aiProvider.complete({
      model: model.name,
      systemPrompt: conversation.agent.systemPrompt,
      messages: history,
      ...(input.temperature === undefined ? {} : { temperature: input.temperature }),
    });

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          content: completion.content,
          modelId: model.id,
          ...(completion.usage?.totalTokens === undefined ? {} : { tokens: completion.usage.totalTokens }),
          metadata: {
            provider: completion.provider,
            model: completion.model,
            usage: completion.usage as Prisma.InputJsonValue | undefined,
          } as Prisma.InputJsonValue,
        },
      });
      await tx.conversation.update({ where: { id: conversationId }, data: { messageCount: { increment: 1 } } });
      return created;
    });

    return { message, provider: completion.provider, model: completion.model, usage: completion.usage };
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
