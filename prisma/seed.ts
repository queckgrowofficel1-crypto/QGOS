import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    console.log('📋 Seeding roles...');
    const adminRole = await prisma.role.upsert({ where: { slug: 'admin' }, update: {}, create: { name: 'Admin', slug: 'admin', description: 'Administrator with full system access', isSystem: true } });
    const moderatorRole = await prisma.role.upsert({ where: { slug: 'moderator' }, update: {}, create: { name: 'Moderator', slug: 'moderator', description: 'Moderator with limited system access', isSystem: true } });
    const agentRole = await prisma.role.upsert({ where: { slug: 'agent' }, update: {}, create: { name: 'Agent', slug: 'agent', description: 'Support agent for customer service', isSystem: true } });
    const userRole = await prisma.role.upsert({ where: { slug: 'user' }, update: {}, create: { name: 'User', slug: 'user', description: 'Regular user', isSystem: true } });
    console.log('✅ Roles seeded:', { admin: adminRole.id, moderator: moderatorRole.id, agent: agentRole.id, user: userRole.id });

    console.log('🔐 Seeding permissions...');
    const permissions = [
      { name: 'View Users', slug: 'view-users', module: 'users', action: 'read' }, { name: 'Create User', slug: 'create-user', module: 'users', action: 'create' }, { name: 'Edit User', slug: 'edit-user', module: 'users', action: 'update' }, { name: 'Delete User', slug: 'delete-user', module: 'users', action: 'delete' }, { name: 'Suspend User', slug: 'suspend-user', module: 'users', action: 'update' },
      { name: 'View Transactions', slug: 'view-transactions', module: 'transactions', action: 'read' }, { name: 'View Wallets', slug: 'view-wallets', module: 'wallets', action: 'read' }, { name: 'Process Withdrawal', slug: 'process-withdrawal', module: 'withdrawals', action: 'update' }, { name: 'Approve Deposit', slug: 'approve-deposit', module: 'deposits', action: 'update' },
      { name: 'View Investments', slug: 'view-investments', module: 'investments', action: 'read' }, { name: 'Manage Packages', slug: 'manage-packages', module: 'packages', action: 'update' }, { name: 'Create Package', slug: 'create-package', module: 'packages', action: 'create' },
      { name: 'View KYC', slug: 'view-kyc', module: 'kyc', action: 'read' }, { name: 'Approve KYC', slug: 'approve-kyc', module: 'kyc', action: 'update' }, { name: 'Reject KYC', slug: 'reject-kyc', module: 'kyc', action: 'update' },
      { name: 'View Audit Logs', slug: 'view-audit-logs', module: 'audit', action: 'read' }, { name: 'Manage Settings', slug: 'manage-settings', module: 'settings', action: 'update' }, { name: 'Manage Roles', slug: 'manage-roles', module: 'roles', action: 'update' }, { name: 'View Reports', slug: 'view-reports', module: 'reports', action: 'read' },
      { name: 'View Income', slug: 'view-income', module: 'income', action: 'read' }, { name: 'Process Income', slug: 'process-income', module: 'income', action: 'update' }, { name: 'Send Notification', slug: 'send-notification', module: 'notifications', action: 'create' }, { name: 'View Notifications', slug: 'view-notifications', module: 'notifications', action: 'read' },
    ];
    const createdPermissions = await Promise.all(permissions.map((permission) => prisma.permission.upsert({ where: { slug: permission.slug }, update: {}, create: { ...permission, isSystem: true } })));
    console.log(`✅ ${createdPermissions.length} permissions seeded`);

    await prisma.role.update({ where: { id: adminRole.id }, data: { permissions: { connect: createdPermissions.map((p) => ({ id: p.id })) } } });
    const moderatorPermissions = createdPermissions.filter((p) => !['manage-settings', 'manage-roles'].includes(p.slug));
    await prisma.role.update({ where: { id: moderatorRole.id }, data: { permissions: { connect: moderatorPermissions.map((p) => ({ id: p.id })) } } });
    const agentPermissions = createdPermissions.filter((p) => ['view-users', 'view-transactions', 'view-wallets', 'view-kyc', 'view-income'].includes(p.slug));
    await prisma.role.update({ where: { id: agentRole.id }, data: { permissions: { connect: agentPermissions.map((p) => ({ id: p.id })) } } });
    console.log('✅ Permissions assigned to roles');

    console.log('👤 Seeding admin user...');
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
    if (!adminPassword || adminPassword.length < 12) throw new Error('ADMIN_INITIAL_PASSWORD must be set and contain at least 12 characters');
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@qgos.com' }, update: {},
      create: { email: 'admin@qgos.com', username: 'admin', password: hashedPassword, firstName: 'System', lastName: 'Administrator', fullName: 'System Administrator', status: 'ACTIVE', role: 'ADMIN', isEmailVerified: true, isPhoneVerified: true, roles: { connect: [{ id: adminRole.id }] } },
    });
    console.log('✅ Admin user seeded:', { id: adminUser.id, email: adminUser.email, username: adminUser.username });

    console.log('💼 Creating admin wallets...');
    for (const type of ['PRIMARY', 'SECONDARY', 'TRADING']) {
      await prisma.wallet.upsert({ where: { userId_type: { userId: adminUser.id, type: type as any } }, update: {}, create: { userId: adminUser.id, type: type as any, currency: 'USD', balance: 0, isActive: true } });
    }
    console.log('✅ Admin wallets created');

    console.log('⚙️ Seeding system settings...');
    const settings = [
      { key: 'platform.name', value: { text: 'QGOS - QueckGrow AI Operating System' }, description: 'Platform name', category: 'platform' },
      { key: 'platform.version', value: { version: '1.0.0' }, description: 'Platform version', category: 'platform' },
      { key: 'platform.currency', value: { currency: 'USD', symbol: '$' }, description: 'Default currency', category: 'platform' },
      { key: 'referral.max_levels', value: { levels: 10 }, description: 'Maximum referral levels', category: 'referral' },
      { key: 'referral.commission_percentage', value: { level1: 10, level2: 5, level3: 2 }, description: 'Referral commission percentages', category: 'referral' },
      { key: 'binary.pair_bonus', value: { bonus: 50 }, description: 'Binary pair bonus amount', category: 'binary' },
      { key: 'withdrawal.minimum_amount', value: { amount: 10 }, description: 'Minimum withdrawal amount', category: 'withdrawal' },
      { key: 'withdrawal.maximum_amount', value: { amount: 100000 }, description: 'Maximum withdrawal amount', category: 'withdrawal' },
      { key: 'withdrawal.processing_fee_percentage', value: { percentage: 2 }, description: 'Withdrawal processing fee', category: 'withdrawal' },
      { key: 'kyc.required', value: { enabled: true }, description: 'KYC requirement enabled', category: 'kyc', isPublic: true },
      { key: 'kyc.max_document_size_mb', value: { size: 5 }, description: 'Maximum KYC document size in MB', category: 'kyc' },
      { key: 'email.smtp_host', value: { host: process.env.SMTP_HOST || 'smtp.gmail.com' }, description: 'SMTP host for email', category: 'email' },
      { key: 'email.smtp_port', value: { port: parseInt(process.env.SMTP_PORT || '587', 10) }, description: 'SMTP port for email', category: 'email' },
      { key: 'security.two_factor_auth_enabled', value: { enabled: true }, description: '2FA is enabled', category: 'security', isPublic: true },
      { key: 'maintenance.mode', value: { enabled: false }, description: 'Maintenance mode', category: 'maintenance' },
    ];
    const createdSettings = await Promise.all(settings.map((setting) => prisma.setting.upsert({ where: { key: setting.key }, update: { value: setting.value }, create: { key: setting.key, value: setting.value, description: setting.description, category: setting.category, isPublic: setting.isPublic || false } })));
    console.log(`✅ ${createdSettings.length} system settings seeded`);

    console.log('📦 Seeding investment packages...');
    const packages = [
      { name: 'Basic Package', type: 'BASIC', description: 'Perfect for beginners', minAmount: 100, maxAmount: 999, dailyROI: 0.5, monthlyROI: 15, yearlyROI: 180, maturityPeriodDays: 365, referralBonusPercentage: 10, displayOrder: 1 },
      { name: 'Standard Package', type: 'STANDARD', description: 'For regular investors', minAmount: 1000, maxAmount: 4999, dailyROI: 0.7, monthlyROI: 21, yearlyROI: 252, maturityPeriodDays: 365, referralBonusPercentage: 15, displayOrder: 2 },
      { name: 'Premium Package', type: 'PREMIUM', description: 'For serious investors', minAmount: 5000, maxAmount: 24999, dailyROI: 1.0, monthlyROI: 30, yearlyROI: 360, maturityPeriodDays: 365, referralBonusPercentage: 20, displayOrder: 3 },
      { name: 'Elite Package', type: 'ELITE', description: 'Exclusive for high-value investors', minAmount: 25000, maxAmount: 99999, dailyROI: 1.5, monthlyROI: 45, yearlyROI: 540, maturityPeriodDays: 365, referralBonusPercentage: 25, displayOrder: 4 },
      { name: 'VIP Package', type: 'VIP', description: 'Premium VIP experience', minAmount: 100000, maxAmount: 1000000, dailyROI: 2.0, monthlyROI: 60, yearlyROI: 720, maturityPeriodDays: 365, referralBonusPercentage: 30, maxInvestors: 50, displayOrder: 5 },
    ];
    const createdPackages = await Promise.all(packages.map((pkg) => prisma.package.upsert({ where: { name: pkg.name }, update: {}, create: { ...pkg, minAmount: parseFloat(pkg.minAmount.toString()), maxAmount: parseFloat(pkg.maxAmount.toString()) } })));
    console.log(`✅ ${createdPackages.length} investment packages seeded`);

    console.log('🔍 Verifying database integrity...');
    const [userCount, roleCount, permissionCount, settingCount, packageCount, walletCount] = await Promise.all([
      prisma.user.count(), prisma.role.count(), prisma.permission.count(), prisma.setting.count(), prisma.package.count(), prisma.wallet.count(),
    ]);
    console.log('✅ Database verification complete:', { users: userCount, roles: roleCount, permissions: permissionCount, settings: settingCount, packages: packageCount, wallets: walletCount });
    console.log('\n🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
