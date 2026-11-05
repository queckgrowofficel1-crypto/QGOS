import { BadRequestException } from '@nestjs/common';
import { TaskType } from '@prisma/client';
import { executeSafeStep, parseWorkflowDefinition } from './workflow.service';

describe('safe workflow execution', () => {
  it('orders dependent steps before their consumers', () => {
    const definition = parseWorkflowDefinition(JSON.stringify({
      steps: [
        { id: 'second', name: 'Double', type: 'TRANSFORM', operation: 'sum', values: [2, 3], dependsOn: ['first'] },
        { id: 'first', name: 'Flag', type: 'CONDITION', operation: 'equals', path: 'input.enabled', value: true },
      ],
    }));
    expect(definition.steps.map((step) => step.id)).toEqual(['first', 'second']);
  });

  it('rejects dependency cycles', () => {
    expect(() => parseWorkflowDefinition(JSON.stringify({
      steps: [
        { id: 'a', name: 'A', type: 'TRANSFORM', operation: 'set', value: 1, dependsOn: ['b'] },
        { id: 'b', name: 'B', type: 'TRANSFORM', operation: 'set', value: 2, dependsOn: ['a'] },
      ],
    }))).toThrow(BadRequestException);
  });

  it('fails closed for unsupported task types', () => {
    expect(() => parseWorkflowDefinition(JSON.stringify({
      steps: [{ id: 'external', name: 'External action', type: 'WEBHOOK' }],
    }))).toThrow(/requires a separately configured adapter/);
  });

  it('evaluates pure transform and condition steps', () => {
    expect(executeSafeStep({
      id: 'sum', name: 'Sum', type: TaskType.TRANSFORM, operation: 'sum', values: [3, 4],
    }, {})).toBe(7);
    expect(executeSafeStep({
      id: 'check', name: 'Check', type: TaskType.CONDITION, operation: 'gte', path: 'input.amount', value: 10,
    }, { input: { amount: 12 } })).toBe(true);
  });

  it('rejects invalid JSON definitions', () => {
    expect(() => parseWorkflowDefinition('{oops')).toThrow(/valid JSON/);
  });
});
