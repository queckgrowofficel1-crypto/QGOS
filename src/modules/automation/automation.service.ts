import { Injectable } from '@nestjs/common';

export type AutomationStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED';

export interface AutomationDefinition {
  id: string;
  name: string;
  status: AutomationStatus;
  trigger: string;
  actions: string[];
}

@Injectable()
export class AutomationService {
  private readonly definitions = new Map<string, AutomationDefinition>();

  list(): AutomationDefinition[] {
    return [...this.definitions.values()];
  }

  create(input: Omit<AutomationDefinition, 'id'>): AutomationDefinition {
    const id = `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const definition = { id, ...input };
    this.definitions.set(id, definition);
    return definition;
  }

  activate(id: string): AutomationDefinition {
    const definition = this.definitions.get(id);
    if (!definition) throw new Error('Automation not found');
    definition.status = 'ACTIVE';
    return definition;
  }

  pause(id: string): AutomationDefinition {
    const definition = this.definitions.get(id);
    if (!definition) throw new Error('Automation not found');
    definition.status = 'PAUSED';
    return definition;
  }
}
