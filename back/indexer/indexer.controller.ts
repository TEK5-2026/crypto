// back/src/blockchain/transfer.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransferEntity } from './transfer.entity';

@Controller('transfers')
export class TransferController {
  constructor(private dataSource: DataSource) {}

  @Get()
  async queryTransfers(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('minValue') minValue?: string,
    @Query('maxValue') maxValue?: string,
    @Query('token') token?: string,
    @Query('blockStart') blockStart?: string,
    @Query('blockEnd') blockEnd?: string,
    @Query('txHash') txHash?: string
  ) {
    const repo = this.dataSource.getRepository(TransferEntity);
    const qb = repo.createQueryBuilder('t');

    if (from) qb.andWhere('t.from = :from', { from });
    if (to) qb.andWhere('t.to = :to', { to });
    if (minValue) qb.andWhere('t.value >= :minValue', { minValue });
    if (maxValue) qb.andWhere('t.value <= :maxValue', { maxValue });
    if (token) qb.andWhere('t.tokenAddress = :token', { token });
    if (blockStart) qb.andWhere('t.blockNumber >= :blockStart', { blockStart });
    if (blockEnd) qb.andWhere('t.blockNumber <= :blockEnd', { blockEnd });
    if (txHash) qb.andWhere('t.transactionHash = :txHash', { txHash });

    return qb.orderBy('t.blockNumber', 'DESC').getMany();
  }
}
