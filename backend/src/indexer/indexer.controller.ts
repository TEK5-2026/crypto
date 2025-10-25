import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { IndexerService } from './indexer.service.js';
import { TransferEvent } from './transfer.entity.js';
import { QueryTransferDto } from './dto/query-transfer.dto';

@Controller('indexer')
export class IndexerController {
  constructor(private readonly indexerService: IndexerService) {}

  @Get('transfers')
  async getTransfers(
    // Le ValidationPipe utilise les DTOs 'class-validator'
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: QueryTransferDto,
  ): Promise<TransferEvent[]> {
    return this.indexerService.findTransfers(query);
  }
}