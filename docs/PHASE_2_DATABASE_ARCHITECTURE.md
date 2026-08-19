# Phase 2 Database Architecture - QGOS AI Operating System

## Overview

Phase 2 introduces the foundational AI Operating System infrastructure layer to QGOS while preserving all Phase 1 fintech/investment platform functionality. This creates a hybrid system supporting both fintech operations and AI-driven features.

## Architectural Principles

- **Non-destructive:** All 19 Phase 1 models remain untouched
- **Multi-tenant:** Company-based tenant isolation for AI features
- **Minimal Core:** Only essential AI models for MVP production deployment
- **Secure:** API keys and sensitive data stored as hashes/encrypted values
- **Audit-ready:** Full timestamps and relationship tracking

## New Models (14 total)

### 1. Organization & Workspace Tier

**Company** (Phase 2 extension)
- `id` (UUID, PK)
- `name`, `slug` (unique)
- `ownerId` (FK → User, already exists in Phase 1)
- `status` (ACTIVE | INACTIVE | SUSPENDED | ARCHIVED)
- Relationships: owns workspaces, AI agents, workflows, documents
- Soft-delete support
- Indexes: `slug`, `ownerId`, `status`, `createdAt`

**Workspace**
- `id` (UUID, PK)
- `companyId` (FK → Company)
- `name`, `slug` (unique per company)
- `ownerId` (FK → User)
- `status` (ACTIVE | ARCHIVED)
- `isDefault` (Boolean)
- `settings` (JSON for configuration)
- Relationships: contains agents, conversations, workflows
- Soft-delete support
- Unique constraint: `(companyId, slug)`

**Tenant Isolation Strategy:**
- Every AI entity must have `companyId` foreign key
- Query middleware enforces WHERE clause: `companyId = $currentCompanyId`
- Row-Level Security (RLS) policies at PostgreSQL level (optional future enhancement)
- Workspaces provide additional logical isolation within company

---

### 2. AI Provider & Model Tier

**AIProvider** (metadata only, not a relational entity)
- Enum: OPENAI | ANTHROPIC | OPENROUTER | LOCAL | HUGGINGFACE
- Providers stored as enum in AIModel, no separate table needed

**AIModel**
- `id` (UUID, PK)
- `name` (unique), `version`
- `provider` (enum)
- `type` (LLM | EMBEDDING | IMAGE | AUDIO)
- `description` (nullable)
- `inputTokenLimit`, `outputTokenLimit` (Int, nullable)
- `costPerInputToken`, `costPerOutputToken` (Decimal, nullable)
- `isAvailable` (Boolean)
- `metadata` (JSON for provider-specific config)
- Relationships: used by AIAgentVersion, referenced by Messages
- No soft-delete (system metadata)
- Indexes: `provider`, `type`, `isAvailable`, `name`

---

### 3. AI Agent Tier

**AIAgent**
- `id` (UUID, PK)
- `companyId` (FK → Company) **[Tenant isolation]**
- `workspaceId` (FK → Workspace)
- `name`, `slug` (unique per workspace)
- `description` (nullable)
- `createdBy` (FK → User)
- `type` (ASSISTANT | SPECIALIST | ORCHESTRATOR | TOOL)
- `status` (DRAFT | ACTIVE | ARCHIVED)
- `systemPrompt` (Text)
- `settings` (JSON: temperature, max_tokens, etc.)
- `knowledgeBaseIds` (String[] UUIDs)
- `currentVersionId` (FK → AIAgentVersion, nullable)
- Relationships: versions, conversations
- Soft-delete support
- Unique constraint: `(workspaceId, slug)`
- Indexes: `companyId`, `workspaceId`, `status`, `createdBy`

**AIAgentVersion**
- `id` (UUID, PK)
- `agentId` (FK → AIAgent, CASCADE delete)
- `versionNumber` (Int)
- `systemPrompt` (Text)
- `settings` (JSON)
- `modelId` (FK → AIModel)
- `createdBy` (FK → User)
- `changeLog` (String, nullable)
- `isPublished` (Boolean)
- No soft-delete (immutable version history)
- Unique constraint: `(agentId, versionNumber)`
- Indexes: `agentId`, `modelId`, `isPublished`

---

### 4. Conversation & Message Tier

**Conversation**
- `id` (UUID, PK)
- `companyId` (FK → Company) **[Tenant isolation]**
- `workspaceId` (FK → Workspace)
- `userId` (FK → User)
- `agentId` (FK → AIAgent, nullable)
- `title`, `summary` (nullable)
- `status` (ACTIVE | ARCHIVED | COMPLETED)
- `messageCount` (Int, default 0)
- `lastActivityAt` (DateTime)
- Relationships: messages
- Soft-delete support
- Indexes: `companyId`, `workspaceId`, `userId`, `agentId`, `status`, `lastActivityAt`

**Message**
- `id` (UUID, PK)
- `conversationId` (FK → Conversation, CASCADE delete)
- `role` (USER | ASSISTANT | SYSTEM | TOOL)
- `content` (Text)
- `tokens` (Int, nullable - for token counting)
- `modelId` (FK → AIModel, nullable)
- `metadata` (JSON: tool_calls, citations, etc.)
- No soft-delete (conversation history is immutable)
- Indexes: `conversationId`, `role`, `createdAt`

---

### 5. Workflow & Execution Tier

**Workflow**
- `id` (UUID, PK)
- `companyId` (FK → Company) **[Tenant isolation]**
- `workspaceId` (FK → Workspace, nullable)
- `name`, `slug` (unique per company)
- `description` (nullable)
- `createdBy` (FK → User)
- `definition` (Text - JSON DAG representation)
- `status` (DRAFT | PUBLISHED | ARCHIVED)
- `triggerType` (MANUAL | SCHEDULED | WEBHOOK | EVENT)
- `cronExpression` (String, nullable)
- `isActive` (Boolean)
- Relationships: executions, tasks
- Soft-delete support
- Unique constraint: `(companyId, slug)`
- Indexes: `companyId`, `workspaceId`, `status`, `triggerType`, `isActive`

**WorkflowExecution** (workflow run/instance)
- `id` (UUID, PK)
- `workflowId` (FK → Workflow, CASCADE delete)
- `status` (PENDING | RUNNING | COMPLETED | FAILED | CANCELLED | TIMEOUT)
- `input` (JSON, nullable)
- `output` (JSON, nullable)
- `error` (Text, nullable)
- `executedBy` (FK → User, nullable)
- `startedAt` (DateTime, default now)
- `completedAt` (DateTime, nullable)
- `durationMs` (Int, nullable)
- No soft-delete (execution history is immutable)
- Indexes: `workflowId`, `status`, `startedAt`, `executedBy`

**Task** (individual workflow task/step execution)
- `id` (UUID, PK)
- `executionId` (FK → WorkflowExecution, CASCADE delete)
- `workflowId` (FK → Workflow)
- `taskType` (AGENT_CALL | WEBHOOK | DATA_FETCH | TRANSFORM | CONDITION)
- `taskName` (String)
- `status` (PENDING | RUNNING | COMPLETED | FAILED | SKIPPED)
- `input` (JSON, nullable)
- `output` (JSON, nullable)
- `error` (Text, nullable)
- `startedAt` (DateTime)
- `completedAt` (DateTime, nullable)
- `durationMs` (Int, nullable)
- `retryCount` (Int, default 0)
- No soft-delete (task history is immutable)
- Indexes: `executionId`, `workflowId`, `status`, `startedAt`

---

### 6. Knowledge Base & Document Tier

**KnowledgeBase**
- `id` (UUID, PK)
- `companyId` (FK → Company) **[Tenant isolation]**
- `workspaceId` (FK → Workspace, nullable)
- `name`, `description` (nullable)
- `createdBy` (FK → User)
- `documentCount` (Int, default 0)
- `embeddingModel` (String, nullable)
- `isPublic` (Boolean)
- Relationships: documents (many-to-many via junction)
- Soft-delete support
- Indexes: `companyId`, `workspaceId`, `name`

**Document**
- `id` (UUID, PK)
- `companyId` (FK → Company) **[Tenant isolation]**
- `workspaceId` (FK → Workspace, nullable)
- `title` (String)
- `mimeType` (String)
- `fileSize` (BigInt)
- `storagePath` (String - S3/Azure path)
- `status` (DRAFT | PROCESSING | READY | ERROR)
- `uploadedBy` (FK → User)
- `embedding` (Text, nullable - vector representation or JSON)
- `currentVersionId` (FK → DocumentVersion, nullable)
- Relationships: versions, knowledge bases (many-to-many)
- Soft-delete support
- Indexes: `companyId`, `workspaceId`, `status`, `uploadedBy`, `createdAt`

**DocumentVersion**
- `id` (UUID, PK)
- `documentId` (FK → Document, CASCADE delete)
- `versionNumber` (Int)
- `fileSize` (BigInt)
- `storagePath` (String)
- `createdBy` (FK → User)
- `changeLog` (String, nullable)
- No soft-delete (version history is immutable)
- Unique constraint: `(documentId, versionNumber)`
- Indexes: `documentId`, `versionNumber`

**KnowledgeBaseDocument** (junction table)
- `id` (UUID, PK)
- `knowledgeBaseId` (FK → KnowledgeBase, CASCADE delete)
- `documentId` (FK → Document, CASCADE delete)
- Unique constraint: `(knowledgeBaseId, documentId)`

---

### 7. API Security & Integration Tier

**APIKey**
- `id` (UUID, PK)
- `companyId` (FK → Company) **[Tenant isolation]**
- `userId` (FK → User, nullable - for personal keys)
- `name` (String)
- `keyHash` (String, unique) **[Hashed, never plaintext]**
- `type` (PERSONAL | SERVICE | WEBHOOK)
- `permissions` (String[] - scoped access list)
- `lastUsedAt` (DateTime, nullable)
- `expiresAt` (DateTime, nullable)
- `isActive` (Boolean)
- Soft-delete support
- Indexes: `companyId`, `keyHash`, `type`, `isActive`, `expiresAt`

**WebhookEndpoint**
- `id` (UUID, PK)
- `companyId` (FK → Company) **[Tenant isolation]**
- `url` (String)
- `events` (String[] - subscribed event types)
- `isActive` (Boolean)
- `secret` (String) **[Encrypted or stored as hash]**
- `retryCount` (Int, default 3)
- `retryDelaySeconds` (Int, default 60)
- `lastTriggeredAt` (DateTime, nullable)
- Relationships: logs
- Unique constraint: `(companyId, url)`
- Indexes: `companyId`, `url`, `isActive`

**WebhookLog**
- `id` (UUID, PK)
- `webhookEndpointId` (FK → WebhookEndpoint, CASCADE delete)
- `event` (String)
- `payload` (Text - JSON)
- `httpStatus` (Int, nullable)
- `response` (Text, nullable)
- `attempt` (Int, default 1)
- `nextRetryAt` (DateTime, nullable)
- `succeededAt` (DateTime, nullable)
- No soft-delete (webhook history is immutable)
- Indexes: `webhookEndpointId`, `succeededAt`, `createdAt`

---

## Key Design Decisions

### 1. No Separate Company Model Extension Needed
Phase 1 User model is sufficient as Company owner. Relationships exist implicitly through `ownerId` FK.
May add explicit Company model in future if needed.

### 2. Tenant Isolation Strategy
- **Primary:** Every AI model has `companyId` FK and must be queried with company context
- **Secondary:** Workspaces provide logical isolation within company
- **Future:** PostgreSQL RLS policies can enforce row-level security

### 3. Soft Delete Policy
- **Soft-delete:** AIAgent, Workflow, Document, KnowledgeBase, APIKey, WebhookEndpoint
  - User-manageable entities that may need recovery
- **Hard-delete (immutable):** AIAgentVersion, Message, WorkflowExecution, Task, DocumentVersion, WebhookLog
  - Historical/audit data that should never be modified

### 4. API Key Security
- Keys stored as `keyHash` (bcrypt hash)
- Original key returned only once at creation
- Verification via hash comparison, never stored plaintext
- Webhook `secret` also encrypted/hashed (encrypted in DB via middleware)

### 5. Workflow Architecture
- **Workflow:** DAG definition (stored as JSON in `definition` field)
- **WorkflowExecution:** Single run of a workflow
- **Task:** Individual step within an execution
- Allows atomic task retries, partial execution recovery, and detailed audit trails

### 6. Knowledge Base Document Association
- Many-to-many via KnowledgeBaseDocument junction table
- Documents can belong to multiple knowledge bases
- Efficient bulk queries and cleanup

---

## Migration Strategy

### Phase 2 Prisma Migration
1. Create new `prisma/migrations/[timestamp]_add_phase_2_ai_os/migration.sql`
2. Add 14 new tables with proper constraints
3. Preserve all 19 Phase 1 tables untouched
4. Run: `prisma migrate dev --name add_phase_2_ai_os`
5. Prisma will generate `schema.prisma` changes

### Seed Data Updates
- Add sample AIModel seeds (OpenAI, Anthropic models)
- Create test Workspace for seeded admin user
- No financial data changes in Phase 1 seeds

### Validation Steps
1. `prisma format` - Check schema syntax
2. `prisma generate` - Generate Prisma Client
3. `prisma validate` - Validate schema integrity
4. `npm run build` - TypeScript compilation
5. `npm run lint` - ESLint checks
6. Database verification script to count tables and validate FK relationships

---

## Model Count Summary

| Phase | Models | Purpose |
|-------|--------|---------|
| **Phase 1** | 19 | Fintech/Investment Platform |
| **Phase 2** | 14 | AI Operating System Foundation |
| **Total** | 33 | Hybrid System (Fintech + AI) |

---

## Future Enhancements (Not Phase 2)

- [ ] PostgreSQL RLS policies for row-level security
- [ ] Conversation branches/alternative paths
- [ ] Prompt library and template management
- [ ] Workflow scheduling and orchestration service
- [ ] Document embedding vector storage (pgvector extension)
- [ ] Data source integrations (API, DB, cloud storage)
- [ ] Audit logging for AI decisions
- [ ] Usage metering and billing for AI services
- [ ] Multi-workspace projects and team collaboration

---

## Relationships Matrix

```
User (Phase 1)
├── AIAgent (createdBy)
├── AIAgentVersion (createdBy)
├── Conversation (user)
├── Workflow (createdBy)
├── Document (uploadedBy)
├── APIKey (user)
└── KnowledgeBase (createdBy)

Workspace
├── AIAgent
├── Conversation
├── Workflow
└── KnowledgeBase

Company
├── Workspace
├── AIAgent
├── Conversation
├── Workflow
├── Document
├── KnowledgeBase
├── APIKey
└── WebhookEndpoint

AIAgent
├── AIAgentVersion
└── Conversation

Workflow
├── WorkflowExecution
└── Task

WorkflowExecution
└── Task

Conversation
└── Message

KnowledgeBase
└── Document (via KnowledgeBaseDocument)

Document
├── DocumentVersion
└── KnowledgeBase (via KnowledgeBaseDocument)

WebhookEndpoint
└── WebhookLog

APIModel
└── AIAgentVersion
```

---

## Implementation Status

- [ ] Create Phase 2 Prisma schema
- [ ] Generate migration file
- [ ] Update seed data
- [ ] Add database verification script
- [ ] Run Prisma validation
- [ ] Run TypeScript typecheck
- [ ] Run ESLint
- [ ] Run build
- [ ] Create Pull Request
