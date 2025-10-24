import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndexerService } from './indexer.service';
import { TransferController } from './indexer.controller';
import { TransferEntity } from './transfer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransferEntity])],
  controllers: [TransferController],
  providers: [IndexerService],
})
export class IndexerModule {}
