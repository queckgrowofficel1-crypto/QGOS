import { Module } from '@nestjs/common';
import { GenealogyController } from './genealogy.controller';

@Module({ controllers: [GenealogyController] })
export class GenealogyModule {}
