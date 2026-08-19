import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AutomationRecord {
  id: string;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED';
  trigger: string;
  actions: string[];
  createdAt: string;
  updatedAt: string;
}

const PREFIX = 'automation:';

@Injectable()
export class AutomationStore {
  constructor(private readonly prisma: PrismaService) {}

  async all(): Promise<AutomationRecord[]> {
    const rows = await this.prisma.setting.findMany({
      where: { key: { startsWith: PREFIX } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => row.value as unknown as AutomationRecord);
  }

  async get(id: string): Promise<AutomationRecord | undefined> {
    const row = await this.prisma.setting.findUnique({ where: { key: `${PREFIX}${id}` } });
    return row ? (row.value as unknown as AutomationRecord) : undefined;
  }

  async save(record: AutomationRecord): Promise<AutomationRecord> {
    await this.prisma.setting.upsert({
      where: { key: `${PREFIX}${record.id}` },
      create: {
        key: `${PREFIX}${record.id}`,
        value: record,
        category: 'automation',
        description: `Automation definition: ${record.name}`,
      },
      update: {
        value: record,
        category: 'automation',
        description: `Automation definition: ${record.name}`,
      },
    });
    return record;
  }
}
