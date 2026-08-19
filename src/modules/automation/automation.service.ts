import { Injectable, NotFoundException } from '@nestjs/common';
import { AutomationStore, AutomationRecord } from './automation.store';

export type AutomationStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED';
export interface AutomationDefinition extends AutomationRecord {}

@Injectable()
export class AutomationService {
  constructor(private readonly store: AutomationStore) {}

  async list(): Promise<AutomationDefinition[]> {
    return this.store.all();
  }

  async get(id: string): Promise<AutomationDefinition> {
    const definition = await this.store.get(id);
    if (!definition) throw new NotFoundException('Automation not found');
    return definition;
  }

  async create(input: Omit<AutomationDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<AutomationDefinition> {
    const now = new Date().toISOString();
    const definition: AutomationDefinition = {
      id: `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    return this.store.save(definition);
  }

  async activate(id: string): Promise<AutomationDefinition> {
    return this.transition(id, 'ACTIVE');
  }

  async pause(id: string): Promise<AutomationDefinition> {
    return this.transition(id, 'PAUSED');
  }

  private async transition(id: string, status: AutomationStatus): Promise<AutomationDefinition> {
    const definition = await this.get(id);
    definition.status = status;
    definition.updatedAt = new Date().toISOString();
    return this.store.save(definition);
  }
}
