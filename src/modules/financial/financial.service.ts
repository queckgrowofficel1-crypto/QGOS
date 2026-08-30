import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InvestmentStatus, PackageStatus, Prisma, TransactionStatus, TransactionType, WalletType, WithdrawalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvestmentDto, CreateWithdrawalDto, WalletOperationDto, WithdrawalDecisionDto } from './financial.dto';

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) {}

  async getWallet(userId: string, type: WalletType) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId_type: { userId, type } } });
    if (!wallet || wallet.deletedAt || !wallet.isActive) throw new NotFoundException('Active wallet not found');
    return wallet;
  }

  async history(userId: string, type: WalletType) {
    const wallet = await this.getWallet(userId, type);
    return this.prisma.transaction.findMany({ where: { walletId: wallet.id, deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }

  async investments(userId: string) {
    return this.prisma.investment.findMany({ where: { userId, deletedAt: null }, include: { package: true }, orderBy: { createdAt: 'desc' } });
  }

  async withdrawals(userId: string) {
    return this.prisma.withdrawal.findMany({ where: { userId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }

  async createInvestment(input: CreateInvestmentDto) {
    const amount = new Prisma.Decimal(input.amount);
    if (!amount.isFinite() || amount.lte(0)) throw new BadRequestException('Amount must be greater than zero');
    const existing = await this.prisma.transaction.findUnique({ where: { reference: input.reference } });
    if (existing?.investmentId) return this.prisma.investment.findUnique({ where: { id: existing.investmentId }, include: { package: true } });

    return this.prisma.$transaction(async (tx) => {
      const duplicate = await tx.transaction.findUnique({ where: { reference: input.reference } });
      if (duplicate?.investmentId) return tx.investment.findUnique({ where: { id: duplicate.investmentId }, include: { package: true } });
      if (duplicate) throw new BadRequestException('Reference already used');
      const user = await tx.user.findFirst({ where: { id: input.userId, deletedAt: null } });
      if (!user) throw new NotFoundException('User not found');
      const pkg = await tx.package.findFirst({ where: { id: input.packageId, deletedAt: null } });
      if (!pkg || pkg.status !== PackageStatus.ACTIVE) throw new NotFoundException('Active package not found');
      if (amount.lt(pkg.minAmount) || amount.gt(pkg.maxAmount)) throw new BadRequestException('Amount is outside package limits');
      if (pkg.maxInvestors !== null && pkg.currentInvestors >= pkg.maxInvestors) throw new BadRequestException('Package investor limit reached');
      const wallet = await tx.wallet.findUnique({ where: { userId_type: { userId: input.userId, type: input.walletType } } });
      if (!wallet || wallet.deletedAt || !wallet.isActive) throw new NotFoundException('Active wallet not found');
      if (wallet.balance.lt(amount)) throw new BadRequestException('Insufficient wallet balance');
      const investmentDate = new Date();
      const maturityDate = new Date(investmentDate.getTime() + pkg.maturityPeriodDays * 86400000);
      const investment = await tx.investment.create({ data: { userId: input.userId, packageId: pkg.id, amount, status: InvestmentStatus.ACTIVE, dailyROI: pkg.dailyROI, monthlyROI: pkg.monthlyROI, yearlyROI: pkg.yearlyROI, investmentDate, maturityDate } });
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: amount }, lastTransactionAt: investmentDate } });
      await tx.transaction.create({ data: { userId: input.userId, walletId: wallet.id, investmentId: investment.id, type: TransactionType.INVESTMENT, status: TransactionStatus.COMPLETED, amount, fee: new Prisma.Decimal(0), netAmount: amount, currency: input.currency ?? wallet.currency, reference: input.reference, processedAt: investmentDate } });
      await tx.package.update({ where: { id: pkg.id }, data: { currentInvestors: { increment: 1 } } });
      return tx.investment.findUnique({ where: { id: investment.id }, include: { package: true } });
    });
  }

  async createWithdrawal(input: CreateWithdrawalDto) {
    const amount = new Prisma.Decimal(input.amount);
    if (!amount.isFinite() || amount.lte(0)) throw new BadRequestException('Amount must be greater than zero');
    const existing = await this.prisma.transaction.findUnique({ where: { reference: input.reference } });
    if (existing?.withdrawalId) return this.prisma.withdrawal.findUnique({ where: { id: existing.withdrawalId } });
    return this.prisma.$transaction(async (tx) => {
      const duplicate = await tx.transaction.findUnique({ where: { reference: input.reference } });
      if (duplicate?.withdrawalId) return tx.withdrawal.findUnique({ where: { id: duplicate.withdrawalId } });
      if (duplicate) throw new BadRequestException('Reference already used');
      const user = await tx.user.findFirst({ where: { id: input.userId, deletedAt: null } });
      if (!user) throw new NotFoundException('User not found');
      const wallet = await tx.wallet.findUnique({ where: { userId_type: { userId: input.userId, type: input.walletType } } });
      if (!wallet || wallet.deletedAt || !wallet.isActive) throw new NotFoundException('Active wallet not found');
      if (wallet.balance.lt(amount)) throw new BadRequestException('Insufficient wallet balance');
      if (!input.cryptoAddress && !input.bankAccountNumber) throw new BadRequestException('A crypto address or bank account is required');
      const now = new Date();
      const withdrawal = await tx.withdrawal.create({ data: { userId: input.userId, status: WithdrawalStatus.PENDING, amount, fee: new Prisma.Decimal(0), netAmount: amount, currency: input.currency ?? wallet.currency, paymentMethod: input.paymentMethod, cryptoAddress: input.cryptoAddress, cryptoNetwork: input.cryptoNetwork, bankAccountName: input.bankAccountName, bankAccountNumber: input.bankAccountNumber, bankName: input.bankName, bankCode: input.bankCode, bankCountry: input.bankCountry } });
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: amount }, lastTransactionAt: now } });
      await tx.transaction.create({ data: { userId: input.userId, walletId: wallet.id, withdrawalId: withdrawal.id, type: TransactionType.WITHDRAWAL, status: TransactionStatus.PENDING, amount, fee: new Prisma.Decimal(0), netAmount: amount, currency: input.currency ?? wallet.currency, reference: input.reference } });
      return withdrawal;
    });
  }

  async approveWithdrawal(id: string, input: WithdrawalDecisionDto) {
    return this.prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findFirst({ where: { id, deletedAt: null } });
      if (!withdrawal) throw new NotFoundException('Withdrawal not found');
      if (withdrawal.status !== WithdrawalStatus.PENDING) throw new BadRequestException('Only pending withdrawals can be approved');
      const now = new Date();
      const updated = await tx.withdrawal.update({ where: { id }, data: { status: WithdrawalStatus.APPROVED, approvedBy: input.approvedBy, approvalNote: input.note, approvedAt: now } });
      await tx.transaction.updateMany({ where: { withdrawalId: id, status: TransactionStatus.PENDING }, data: { status: TransactionStatus.PROCESSING } });
      return updated;
    });
  }

  async rejectWithdrawal(id: string, input: WithdrawalDecisionDto) {
    return this.prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findFirst({ where: { id, deletedAt: null } });
      if (!withdrawal) throw new NotFoundException('Withdrawal not found');
      if (withdrawal.status !== WithdrawalStatus.PENDING) throw new BadRequestException('Only pending withdrawals can be rejected');
      const transaction = await tx.transaction.findFirst({ where: { withdrawalId: id, deletedAt: null } });
      if (!transaction) throw new NotFoundException('Withdrawal transaction not found');
      const now = new Date();
      await tx.wallet.update({ where: { id: transaction.walletId }, data: { balance: { increment: withdrawal.amount }, lastTransactionAt: now } });
      await tx.transaction.update({ where: { id: transaction.id }, data: { status: TransactionStatus.CANCELLED, failureReason: input.note ?? 'Withdrawal rejected', processedAt: now } });
      return tx.withdrawal.update({ where: { id }, data: { status: WithdrawalStatus.REJECTED, approvedBy: input.approvedBy, rejectionReason: input.note ?? 'Withdrawal rejected' } });
    });
  }

  async completeWithdrawal(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findFirst({ where: { id, deletedAt: null } });
      if (!withdrawal) throw new NotFoundException('Withdrawal not found');
      if (withdrawal.status !== WithdrawalStatus.APPROVED && withdrawal.status !== WithdrawalStatus.PROCESSING) throw new BadRequestException('Withdrawal is not ready for completion');
      const now = new Date();
      const transaction = await tx.transaction.findFirst({ where: { withdrawalId: id, deletedAt: null } });
      if (!transaction) throw new NotFoundException('Withdrawal transaction not found');
      await tx.transaction.update({ where: { id: transaction.id }, data: { status: TransactionStatus.COMPLETED, processedAt: now } });
      await tx.wallet.update({ where: { id: transaction.walletId }, data: { totalWithdrawn: { increment: withdrawal.amount }, lastTransactionAt: now } });
      return tx.withdrawal.update({ where: { id }, data: { status: WithdrawalStatus.COMPLETED, completedAt: now } });
    });
  }

  async credit(input: WalletOperationDto) { return this.apply(input, 'CREDIT'); }
  async debit(input: WalletOperationDto) { return this.apply(input, 'DEBIT'); }

  private async apply(input: WalletOperationDto, direction: 'CREDIT' | 'DEBIT') {
    const amount = new Prisma.Decimal(input.amount);
    if (!amount.isFinite() || amount.lte(0)) throw new BadRequestException('Amount must be greater than zero');
    const existing = await this.prisma.transaction.findUnique({ where: { reference: input.reference } });
    if (existing) return existing;
    return this.prisma.$transaction(async (tx) => {
      const duplicate = await tx.transaction.findUnique({ where: { reference: input.reference } });
      if (duplicate) return duplicate;
      const user = await tx.user.findFirst({ where: { id: input.userId, deletedAt: null } });
      if (!user) throw new NotFoundException('User not found');
      const wallet = await tx.wallet.upsert({ where: { userId_type: { userId: input.userId, type: input.type } }, create: { userId: input.userId, type: input.type, currency: input.currency ?? 'USD' }, update: {} });
      if (!wallet.isActive || wallet.deletedAt) throw new BadRequestException('Wallet is not active');
      if (direction === 'DEBIT' && wallet.balance.lt(amount)) throw new BadRequestException('Insufficient wallet balance');
      const totalUpdate = direction === 'CREDIT' ? { totalDeposited: { increment: amount } } : input.transactionType === TransactionType.WITHDRAWAL ? { totalWithdrawn: { increment: amount } } : {};
      const updatedWallet = await tx.wallet.update({ where: { id: wallet.id }, data: { balance: direction === 'CREDIT' ? { increment: amount } : { decrement: amount }, lastTransactionAt: new Date(), ...totalUpdate } });
      return tx.transaction.create({ data: { userId: input.userId, walletId: updatedWallet.id, type: input.transactionType, status: TransactionStatus.COMPLETED, amount, fee: new Prisma.Decimal(0), netAmount: amount, currency: input.currency ?? updatedWallet.currency, description: input.description, reference: input.reference, processedAt: new Date() } });
    });
  }
}
