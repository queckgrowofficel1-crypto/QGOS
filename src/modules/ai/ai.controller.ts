import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AIService } from './ai.service';
import { AddMessageDto, CreateAgentDto, CreateConversationDto, RespondToAgentDto } from './dto';

@Controller('ai')
export class AIController {
  constructor(private readonly ai: AIService) {}

  @Get('models')
  listModels() { return this.ai.listModels(); }

  @Get('army/readiness')
  getArmyReadiness(@Query('workspaceId') workspaceId: string) {
    return this.ai.getArmyReadiness(workspaceId);
  }

  @Get('agents')
  listAgents(@Query('workspaceId') workspaceId: string) { return this.ai.listAgents(workspaceId); }

  @Post('agents')
  createAgent(@Body() body: CreateAgentDto) { return this.ai.createAgent(body); }

  @Post('conversations')
  createConversation(@Body() body: CreateConversationDto) { return this.ai.createConversation(body); }

  @Get('conversations/:id')
  getConversation(@Param('id') id: string) { return this.ai.getConversation(id); }

  @Post('conversations/:id/messages')
  addMessage(@Param('id') id: string, @Body() body: AddMessageDto) { return this.ai.addMessage(id, body); }

  @Post('conversations/:id/respond')
  respondToAgent(@Param('id') id: string, @Body() body: RespondToAgentDto) {
    return this.ai.respondToConversation(id, body);
  }
}
