import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import { KnowledgeService } from './knowledge.service';

@Controller('ai/knowledge')
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Post('bases')
  createBase(@Body() body: { workspaceId: string; createdBy: string; name: string; slug: string; description?: string; embeddingModel?: string; isPublic?: boolean }) { return this.knowledge.createKnowledgeBase(body); }

  @Get('bases')
  listBases(@Query('workspaceId') workspaceId: string) { return this.knowledge.listKnowledgeBases(workspaceId); }

  @Post('documents')
  createDocument(@Body() body: { workspaceId: string; uploadedBy: string; title: string; mimeType: string; fileSize: string | number; storagePath: string; embedding?: string }) { return this.knowledge.createDocument(body); }

  @Post('bases/:knowledgeBaseId/documents/:documentId')
  linkDocument(@Param('knowledgeBaseId') knowledgeBaseId: string, @Param('documentId') documentId: string, @Body('workspaceId') workspaceId: string) { return this.knowledge.linkDocument(knowledgeBaseId, documentId, workspaceId); }

  @Patch('documents/:documentId/status')
  updateStatus(@Param('documentId') documentId: string, @Body() body: { workspaceId: string; status: DocumentStatus; embedding?: string }) { return this.knowledge.updateDocumentStatus(documentId, body.workspaceId, body.status, body.embedding); }
}
