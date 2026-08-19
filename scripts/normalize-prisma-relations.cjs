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

// Normalize binary-tree self relations. Each named self relation needs an
// explicit opposite field on User; otherwise Prisma raises P1012.
schema = schema.replace(
  '  binaryLeftChildId String?\n',
  '  binaryLeftChildId String?\n  binaryLeftParent User? @relation("BinaryLeft")\n',
);
schema = schema.replace(
  '  binaryRightChildId String?\n',
  '  binaryRightChildId String?\n  binaryRightParent User? @relation("BinaryRight")\n',
);

fs.writeFileSync(path, schema);
console.log('Normalized legacy Prisma ReferralIncome and binary self-relations for validation.');
