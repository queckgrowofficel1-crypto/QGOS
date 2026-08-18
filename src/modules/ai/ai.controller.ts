import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AIService } from './ai.service';

@Controller('ai')
export class AIController {
  constructor(private readonly ai: AIService) {}

  @Get('models')
  listModels() { return this.ai.listModels(); }

  @Get('agents')
  listAgents(@Query('workspaceId') workspaceId: string) { return this.ai.listAgents(workspaceId); }

  @Post('agents')
  createAgent(@Body() body: { workspaceId: string; createdBy: string; name: string; slug: string; systemPrompt: string; description?: string }) {
    return this.ai.createAgent(body);
  }

  @Post('conversations')
  createConversation(@Body() body: { workspaceId: string; userId: string; title: string; agentId?: string }) {
    return this.ai.createConversation(body);
  }

  @Get('conversations/:id')
  getConversation(@Param('id') id: string) { return this.ai.getConversation(id); }

  @Post('conversations/:id/messages')
  addMessage(@Param('id') id: string, @Body() body: { role: any; content: string; modelId?: string; metadata?: any }) {
    return this.ai.addMessage(id, body);
  }
}
