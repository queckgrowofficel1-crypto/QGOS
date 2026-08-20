const fs = require('fs');

const path = 'prisma/schema.prisma';
let schema = fs.readFileSync(path, 'utf8');

// Normalize the two explicit ReferralIncome -> User relations.
schema = schema.replace(
  '  referralIncomes   ReferralIncome[]\n',
  '  referralIncomes   ReferralIncome[] @relation("ReferralIncomeUser")\n  referredIncomeRecords ReferralIncome[] @relation("ReferralIncomeSource")\n',
);
schema = schema.replace(
  '  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)\n  referralUserId    String\n  referralUser      User?           @relation(fields: [referralUserId], references: [id], onDelete: SetNull)',
  '  user              User            @relation("ReferralIncomeUser", fields: [userId], references: [id], onDelete: Cascade)\n  referralUserId    String\n  referralUser      User?           @relation("ReferralIncomeSource", fields: [referralUserId], references: [id], onDelete: SetNull)',
);

// Normalize binary-tree self relations. The inverse sides are arrays so the
// existing optional FK fields remain valid without introducing one-to-one
// uniqueness requirements.
schema = schema.replace(
  '  binaryLeftChildId String?\n',
  '  binaryLeftChildId String?\n  binaryLeftParents User[] @relation("BinaryLeft")\n',
);
schema = schema.replace(
  '  binaryRightChildId String?\n',
  '  binaryRightChildId String?\n  binaryRightParents User[] @relation("BinaryRight")\n',
);

// Normalize missing inverse relations reported by Prisma validation.
schema = schema.replace(
  '  isActive          Boolean     @default(true)\n',
  '  isActive          Boolean     @default(true)\n  transactions      Transaction[]\n',
);
schema = schema.replace(
  '  displayOrder      Int             @default(0)\n',
  '  displayOrder      Int             @default(0)\n  investments       Investment[]\n',
);
schema = schema.replace(
  '  webhooks          WebhookEndpoint[]\n',
  '  webhooks          WebhookEndpoint[]\n  documents         Document[]\n',
);

fs.writeFileSync(path, schema);
console.log('Normalized legacy Prisma relations for validation.');