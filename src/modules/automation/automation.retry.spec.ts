import { AutomationRetryService } from './automation.retry';
import { AutomationDefinition } from './automation.service';

describe('AutomationRetryService', () => {
  const definition: AutomationDefinition = {
    id: 'auto_retry', name: 'retry', status: 'ACTIVE', trigger: 'manual', actions: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };

  it('stops after a successful attempt', async () => {
    const executor = { execute: jest.fn().mockResolvedValue({ automationId: definition.id, status: 'COMPLETED', startedAt: '', completedAt: '', executedActions: [] }) } as any;
    const service = new AutomationRetryService(executor);
    const result = await service.executeWithRetry(definition, 3, 0);
    expect(result.status).toBe('COMPLETED');
    expect(executor.execute).toHaveBeenCalledTimes(1);
  });

  it('bounds failed attempts', async () => {
    const executor = { execute: jest.fn().mockResolvedValue({ automationId: definition.id, status: 'FAILED', startedAt: '', completedAt: '', executedActions: [], error: 'failed' }) } as any;
    const service = new AutomationRetryService(executor);
    const result = await service.executeWithRetry(definition, 3, 0);
    expect(result.status).toBe('FAILED');
    expect(executor.execute).toHaveBeenCalledTimes(3);
  });
});
