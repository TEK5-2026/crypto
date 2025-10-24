import { Injectable, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import { DataSource } from 'typeorm';
import { TransferEntity } from './transfer.entity';

@Injectable()
export class IndexerService implements OnModuleInit {
  private httpProvider: ethers.JsonRpcProvider;
  private wsProvider: ethers.WebSocketProvider;
  private tokenContractHTTP: ethers.Contract;
  private tokenContractWS: ethers.Contract;
  private lastIndexedBlock = 0;

  private BATCH_SIZE = 1000;

  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    // Providers
    this.httpProvider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.wsProvider = new ethers.WebSocketProvider(
      process.env.RPC_URL.replace('https://', 'wss://')
    );

    const erc20Abi = [
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ];

    this.tokenContractHTTP = new ethers.Contract(
      process.env.COFFEE_TOKEN_ADDRESS,
      erc20Abi,
      this.httpProvider
    );

    this.tokenContractWS = new ethers.Contract(
      process.env.COFFEE_TOKEN_ADDRESS,
      erc20Abi,
      this.wsProvider
    );

    // Dernier bloc indexé depuis DB
    const latestTransfer = await this.dataSource.getRepository(TransferEntity)
      .createQueryBuilder('t')
      .orderBy('t.blockNumber', 'DESC')
      .getOne();
    this.lastIndexedBlock = latestTransfer?.blockNumber || 0;

    console.log(`📌 Starting indexer from block ${this.lastIndexedBlock}`);

    // Historique batch
    await this.indexHistorical();

    this.listenRealtime();
  }

  private async indexHistorical() {
    const latestBlock = await this.httpProvider.getBlockNumber();
    if (this.lastIndexedBlock >= latestBlock) return;

    console.log(`📌 Fetching historical transfers from ${this.lastIndexedBlock + 1} to ${latestBlock}`);

    const filter = this.tokenContractHTTP.filters.Transfer();

    for (let start = this.lastIndexedBlock + 1; start <= latestBlock; start += this.BATCH_SIZE) {
      const end = Math.min(start + this.BATCH_SIZE - 1, latestBlock);
      console.log(`📌 Fetching blocks ${start} to ${end}`);
      const events = await this.tokenContractHTTP.queryFilter(filter, start, end);

      for (const event of events) {
        await this.saveEvent(event);
        this.lastIndexedBlock = event.blockNumber;
      }
    }
  }

  private listenRealtime() {
    this.tokenContractWS.on('Transfer', async (from, to, value, event) => {
      try {
        await this.saveEvent(event);
        console.log('🔥 New Transfer:', {
          from,
          to,
          value: value.toString(),
          block: event.blockNumber
        });
      } catch (err) {
        console.error('Error saving transfer:', err);
      }
    });

    this.wsProvider._websocket.on('close', async () => {
      console.log('⚡ WebSocket closed. Reconnecting...');
      setTimeout(() => this.listenRealtime(), 1000);
    });
  }

  private async saveEvent(event: ethers.Event) {
    const block = await this.httpProvider.getBlock(event.blockNumber);
    const repo = this.dataSource.getRepository(TransferEntity);

    const transfer = repo.create({
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      blockTimestamp: block.timestamp,
      logIndex: event.logIndex,
      tokenAddress: event.address,
      from: event.args?.from,
      to: event.args?.to,
      value: event.args?.value as bigint
    });

    await repo.save(transfer);
  }
}
