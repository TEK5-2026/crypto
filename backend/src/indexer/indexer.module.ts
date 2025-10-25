import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndexerService } from './indexer.service';
import { IndexerController } from './indexer.controller';
import { TransferEvent } from './transfer.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransferEvent]), // Importe l'entité
  ],
  providers: [IndexerService],
  controllers: [IndexerController],
})
export class IndexerModule {}