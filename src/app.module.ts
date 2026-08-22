import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AIModule } from './modules/ai/ai.module';
import { AutomationModule } from './modules/automation/automation.module';
import { FinancialModule } from './modules/financial/financial.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.example'],
    }),
    PrismaModule,
    AIModule,
    AutomationModule,
    FinancialModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
