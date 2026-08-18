import { Injectable, NotFoundException } from '@nestjs/common';
import { AutomationStore, AutomationRecord } from './automation.store';

export type AutomationStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED';
export interface AutomationDefinition extends AutomationRecord {}

@Injectable()
export class AutomationService {
  constructor(private readonly store: AutomationStore) {}

  list(): AutomationDefinition[] { return this.store.all(); }

  create(input: Omit<AutomationDefinition, 'id' | 'createdAt' | 'updatedAt'>): AutomationDefinition {
    const now = new Date().toISOString();
    const definition: AutomationDefinition = {
      id: `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    return this.store.save(definition);
  }

  activate(id: string): AutomationDefinition { return this.transition(id, 'ACTIVE'); }
  pause(id: string): AutomationDefinition { return this.transition(id, 'PAUSED'); }

  private transition(id: string, status: AutomationStatus): AutomationDefinition {
    const definition = this.store.get(id);
    if (!definition) throw new NotFoundException('Automation not found');
    definition.status = status;
    definition.updatedAt = new Date().toISOString();
    return this.store.save(definition);
  }
}
