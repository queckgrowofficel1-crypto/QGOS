import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  TaskStatus,
  TaskType,
  WorkflowExecutionStatus,
  WorkflowStatus,
  WorkflowTriggerType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type JsonObject = Record<string, unknown>;
type SafeStep = {
  id: string;
  name: string;
  type: TaskType;
  operation?: string;
  path?: string;
  value?: unknown;
  values?: unknown[];
  input?: JsonObject;
  dependsOn?: string[];
};
type WorkflowDefinition = { steps: SafeStep[] };

const SAFE_STEP_TYPES = new Set<TaskType>([TaskType.TRANSFORM, TaskType.CONDITION]);

export function parseWorkflowDefinition(raw: string): WorkflowDefinition {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new BadRequestException('Workflow definition must be valid JSON');
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as JsonObject).steps)) {
    throw new BadRequestException('Workflow definition must contain a steps array');
  }
  const steps = (parsed as { steps: unknown[] }).steps;
  if (steps.length === 0) throw new BadRequestException('Workflow must contain at least one step');

  const seen = new Set<string>();
  for (const item of steps) {
    if (!item || typeof item !== 'object') throw new BadRequestException('Each workflow step must be an object');
    const step = item as SafeStep;
    if (!step.id || typeof step.id !== 'string' || !step.name || typeof step.name !== 'string') {
      throw new BadRequestException('Each workflow step requires string id and name fields');
    }
    if (seen.has(step.id)) throw new BadRequestException(`Duplicate workflow step id: ${step.id}`);
    seen.add(step.id);
    if (!Object.values(TaskType).includes(step.type)) throw new BadRequestException(`Unsupported task type on step ${step.id}`);
    if (!Array.isArray(step.dependsOn ?? [])) throw new BadRequestException(`dependsOn must be an array on step ${step.id}`);
  }

  for (const item of steps as SafeStep[]) {
    for (const dependency of item.dependsOn ?? []) {
      if (!seen.has(dependency)) throw new BadRequestException(`Unknown dependency ${dependency} on step ${item.id}`);
      if (dependency === item.id) throw new BadRequestException(`Step ${item.id} cannot depend on itself`);
    }
  }

  const byId = new Map((steps as SafeStep[]).map((step) => [step.id, step]));
  const ordered: SafeStep[] = [];
  const pending = new Set(byId.keys());
  while (pending.size > 0) {
    const ready = [...pending].filter((id) => (byId.get(id)?.dependsOn ?? []).every((dep) => !pending.has(dep)));
    if (ready.length === 0) throw new BadRequestException('Workflow dependencies contain a cycle');
    for (const id of ready) {
      ordered.push(byId.get(id)!);
      pending.delete(id);
    }
  }

  // This worker deliberately supports only deterministic, side-effect-free steps.
  for (const step of ordered) {
    if (!SAFE_STEP_TYPES.has(step.type)) {
      throw new BadRequestException(`Step ${step.id} uses ${step.type}, which requires a separately configured adapter and is disabled in the safe worker`);
    }
  }
  return { steps: ordered };
}

function getPath(root: unknown, path: string | undefined): unknown {
  if (!path) throw new BadRequestException('A path is required for this operation');
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as JsonObject)[key];
  }, root);
}

export function executeSafeStep(step: SafeStep, context: JsonObject): unknown {
  if (step.type === TaskType.TRANSFORM) {
    switch (step.operation) {
      case 'set':
        return step.value ?? null;
      case 'copy':
        return getPath(context, step.path);
      case 'sum': {
        const values = step.values ?? [];
        if (!values.every((value) => typeof value === 'number' && Number.isFinite(value))) {
          throw new BadRequestException(`Step ${step.id}: sum values must all be finite numbers`);
        }
        return values.reduce<number>((sum, value) => sum + (value as number), 0);
      }
      case 'concat': {
        const values = step.values ?? [];
        if (!values.every((value) => typeof value === 'string')) {
          throw new BadRequestException(`Step ${step.id}: concat values must all be strings`);
        }
        return values.join('');
      }
      case 'merge': {
        const values = step.values ?? [];
        if (!values.every((value) => value && typeof value === 'object' && !Array.isArray(value))) {
          throw new BadRequestException(`Step ${step.id}: merge values must all be objects`);
        }
        return Object.assign({}, ...values);
      }
      default:
        throw new BadRequestException(`Step ${step.id}: unsupported transform operation`);
    }
  }

  if (step.type === TaskType.CONDITION) {
    const actual = getPath(context, step.path);
    switch (step.operation) {
      case 'exists': return actual !== undefined && actual !== null;
      case 'truthy': return Boolean(actual);
      case 'equals': return actual === step.value;
      case 'notEquals': return actual !== step.value;
      case 'gt': return typeof actual === 'number' && typeof step.value === 'number' && actual > step.value;
      case 'gte': return typeof actual === 'number' && typeof step.value === 'number' && actual >= step.value;
      case 'lt': return typeof actual === 'number' && typeof step.value === 'number' && actual < step.value;
      case 'lte': return typeof actual === 'number' && typeof step.value === 'number' && actual <= step.value;
      default:
        throw new BadRequestException(`Step ${step.id}: unsupported condition operation`);
    }
  }

  throw new BadRequestException(`Step ${step.id}: task type is not enabled in the safe worker`);
}

@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: { workspaceId: string; createdBy: string; name: string; slug: string; description?: string; definition: string; triggerType?: WorkflowTriggerType; cronExpression?: string }) {
    await this.ensureWorkspace(input.workspaceId);
    await this.ensureUser(input.createdBy);
    // Validate definitions before they can be published or executed.
    parseWorkflowDefinition(input.definition);
    return this.prisma.workflow.create({ data: input });
  }

  async list(workspaceId: string) {
    await this.ensureWorkspace(workspaceId);
    return this.prisma.workflow.findMany({ where: { workspaceId, deletedAt: null }, orderBy: { updatedAt: 'desc' } });
  }

  async publish(id: string) {
    const workflow = await this.prisma.workflow.findFirst({ where: { id, deletedAt: null } });
    if (!workflow) throw new NotFoundException('Workflow not found');
    parseWorkflowDefinition(workflow.definition);
    return this.prisma.workflow.update({ where: { id }, data: { status: WorkflowStatus.PUBLISHED } });
  }

  async execute(id: string, input?: Record<string, unknown>) {
    const workflow = await this.prisma.workflow.findFirst({ where: { id, deletedAt: null, isActive: true } });
    if (!workflow) throw new NotFoundException('Workflow not found or inactive');
    if (workflow.status !== WorkflowStatus.PUBLISHED) throw new BadRequestException('Workflow is not published');

    // Fail fast for invalid/unsupported definitions before creating an execution.
    parseWorkflowDefinition(workflow.definition);
    const execution = await this.prisma.workflowExecution.create({
      data: {
        workflowId: id,
        status: WorkflowExecutionStatus.PENDING,
        ...(input === undefined ? {} : { input: input as Prisma.InputJsonValue }),
      },
    });
    return this.processExecution(execution.id);
  }

  async processExecution(executionId: string) {
    const claimed = await this.prisma.workflowExecution.updateMany({
      where: { id: executionId, status: WorkflowExecutionStatus.PENDING },
      data: { status: WorkflowExecutionStatus.RUNNING },
    });
    if (claimed.count === 0) {
      const existing = await this.prisma.workflowExecution.findUnique({ where: { id: executionId } });
      if (!existing) throw new NotFoundException('Workflow execution not found');
      return existing;
    }

    const startedAt = Date.now();
    let currentTaskId: string | undefined;
    const outputs: JsonObject = {};
    try {
      const execution = await this.prisma.workflowExecution.findUnique({
        where: { id: executionId },
        include: { workflow: true },
      });
      if (!execution) throw new NotFoundException('Workflow execution not found');
      const definition = parseWorkflowDefinition(execution.workflow.definition);
      const workflowInput = (execution.input ?? {}) as JsonObject;

      for (const step of definition.steps) {
        const task = await this.prisma.task.create({
          data: {
            executionId,
            workflowId: execution.workflowId,
            taskType: step.type,
            taskName: step.name,
            status: TaskStatus.RUNNING,
            input: {
              workflowInput: workflowInput as Prisma.InputJsonValue,
              dependencyOutputs: outputs as Prisma.InputJsonValue,
              stepInput: (step.input ?? {}) as Prisma.InputJsonValue,
            },
          },
        });
        currentTaskId = task.id;
        const context: JsonObject = {
          input: workflowInput,
          steps: outputs,
          step: step.input ?? {},
        };
        const result = executeSafeStep(step, context);
        // Store only JSON-safe outputs; undefined becomes explicit null.
        const safeResult = result === undefined ? null : result;
        outputs[step.id] = safeResult;
        await this.prisma.task.update({
          where: { id: task.id },
          data: { status: TaskStatus.COMPLETED, output: { value: safeResult } as Prisma.InputJsonValue, completedAt: new Date(), durationMs: Math.max(0, Date.now() - task.startedAt.getTime()) },
        });
        currentTaskId = undefined;
      }

      return await this.prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: WorkflowExecutionStatus.COMPLETED,
          output: { steps: outputs } as Prisma.InputJsonValue,
          completedAt: new Date(),
          durationMs: Math.max(0, Date.now() - startedAt),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown workflow execution error';
      if (currentTaskId) {
        await this.prisma.task.update({
          where: { id: currentTaskId },
          data: { status: TaskStatus.FAILED, error: message, completedAt: new Date() },
        }).catch(() => undefined);
      }
      return this.prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: WorkflowExecutionStatus.FAILED,
          error: message,
          output: { steps: outputs } as Prisma.InputJsonValue,
          completedAt: new Date(),
          durationMs: Math.max(0, Date.now() - startedAt),
        },
      });
    }
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
