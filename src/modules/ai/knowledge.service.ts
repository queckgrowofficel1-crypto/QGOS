import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  async createKnowledgeBase(input: { workspaceId: string; createdBy: string; name: string; slug: string; description?: string; embeddingModel?: string; isPublic?: boolean }) {
    await this.ensureWorkspace(input.workspaceId);
    return this.prisma.knowledgeBase.create({ data: input });
  }

  async listKnowledgeBases(workspaceId: string) {
    await this.ensureWorkspace(workspaceId);
    return this.prisma.knowledgeBase.findMany({ where: { workspaceId, deletedAt: null }, include: { _count: { select: { documents: true } } }, orderBy: { updatedAt: 'desc' } });
  }

  async createDocument(input: { workspaceId: string; uploadedBy: string; title: string; mimeType: string; fileSize: string | number; storagePath: string; embedding?: string }) {
    await this.ensureWorkspace(input.workspaceId);
    const size = BigInt(input.fileSize);
    if (size < 0n) throw new BadRequestException('fileSize must be non-negative');
    return this.prisma.document.create({ data: { workspaceId: input.workspaceId, uploadedBy: input.uploadedBy, title: input.title, mimeType: input.mimeType, fileSize: size, storagePath: input.storagePath, embedding: input.embedding, status: DocumentStatus.PROCESSING } });
  }

  async linkDocument(knowledgeBaseId: string, documentId: string, workspaceId: string) {
    const [knowledgeBase, document] = await Promise.all([
      this.prisma.knowledgeBase.findFirst({ where: { id: knowledgeBaseId, workspaceId, deletedAt: null } }),
      this.prisma.document.findFirst({ where: { id: documentId, workspaceId, deletedAt: null } }),
    ]);
    if (!knowledgeBase) throw new NotFoundException('Knowledge base not found in this workspace');
    if (!document) throw new NotFoundException('Document not found in this workspace');
    return this.prisma.$transaction(async (tx) => {
      const link = await tx.knowledgeBaseDocument.upsert({ where: { knowledgeBaseId_documentId: { knowledgeBaseId, documentId } }, create: { knowledgeBaseId, documentId }, update: {} });
      const count = await tx.knowledgeBaseDocument.count({ where: { knowledgeBaseId } });
      await tx.knowledgeBase.update({ where: { id: knowledgeBaseId }, data: { documentCount: count } });
      return link;
    });
  }

  async updateDocumentStatus(documentId: string, workspaceId: string, status: DocumentStatus, embedding?: string) {
    const document = await this.prisma.document.findFirst({ where: { id: documentId, workspaceId, deletedAt: null } });
    if (!document) throw new NotFoundException('Document not found in this workspace');
    return this.prisma.document.update({ where: { id: documentId }, data: { status, ...(embedding !== undefined ? { embedding } : {}) } });
  }

  private async ensureWorkspace(id: string) {
    const workspace = await this.prisma.workspace.findFirst({ where: { id, deletedAt: null } });
    if (!workspace) throw new NotFoundException('Workspace not found');
  }
}
