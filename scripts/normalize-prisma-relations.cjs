const fs = require('fs');

const path = 'prisma/schema.prisma';
let schema = fs.readFileSync(path, 'utf8');

schema = schema.replace(
  '  referralIncomes   ReferralIncome[]\n',
  '  referralIncomes   ReferralIncome[] @relation("ReferralIncomeUser")\n  referredIncomeRecords ReferralIncome[] @relation("ReferralIncomeSource")\n',
);
schema = schema.replace(
  '  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)\n  referralUserId    String\n  referralUser      User?           @relation(fields: [referralUserId], references: [id], onDelete: SetNull)',
  '  user              User            @relation("ReferralIncomeUser", fields: [userId], references: [id], onDelete: Cascade)\n  referralUserId    String\n  referralUser      User?           @relation("ReferralIncomeSource", fields: [referralUserId], references: [id], onDelete: SetNull)',
);

fs.writeFileSync(path, schema);
console.log('Normalized Prisma ReferralIncome relations for validation.');
