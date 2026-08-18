import { Injectable } from '@nestjs/common';

export interface AutomationRecord {
  id: string;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED';
  trigger: string;
  actions: string[];
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class AutomationStore {
  private readonly records = new Map<string, AutomationRecord>();

  all(): AutomationRecord[] { return [...this.records.values()]; }

  get(id: string): AutomationRecord | undefined { return this.records.get(id); }

  save(record: AutomationRecord): AutomationRecord {
    this.records.set(record.id, record);
    return record;
  }
}
