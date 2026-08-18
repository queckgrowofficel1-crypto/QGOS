import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { GenealogyModule } from './genealogy/genealogy.module';
import { HealthController } from './health/health.controller';
import { PackagesModule } from './packages/packages.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PackagesModule,
    GenealogyModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
