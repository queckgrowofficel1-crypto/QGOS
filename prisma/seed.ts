import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@qgos.local' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@qgos.local',
      passwordHash,
      referralCode: 'QG-DEMO-001',
      wallet: { create: { balance: 0 } },
    },
  });

  console.log(`Seeded user: ${user.email}`);
}

main().finally(() => prisma.$disconnect());
