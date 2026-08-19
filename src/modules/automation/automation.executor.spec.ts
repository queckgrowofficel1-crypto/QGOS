import { AutomationExecutor } from './automation.executor';
import { AutomationDefinition } from './automation.service';

describe('AutomationExecutor', () => {
  const executor = new AutomationExecutor();
  const active: AutomationDefinition = {
    id: 'auto_1', name: 'test', status: 'ACTIVE', trigger: 'manual', actions: ['one', 'two'],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };

  it('executes active automations', async () => {
    const result = await executor.execute(active);
    expect(result.status).toBe('COMPLETED');
    expect(result.executedActions).toEqual(['one', 'two']);
  });

  it('fails inactive automations safely', async () => {
    const result = await executor.execute({ ...active, status: 'PAUSED' });
    expect(result.status).toBe('FAILED');
    expect(result.error).toContain('ACTIVE');
  });
});
