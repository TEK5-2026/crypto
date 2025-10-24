import { Injectable, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import { DataSource } from 'typeorm';
import { TransferEntity } from './transfer.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IndexerService implements OnModuleInit {
  private httpProvider: ethers.JsonRpcProvider;
  private wsProvider: ethers.WebSocketProvider;
  private tokenContractHTTP: ethers.Contract;
  private tokenContractWS: ethers.Contract;
  private lastIndexedBlock = 0;

  private readonly BATCH_SIZE = 10;

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const rpcUrl = this.configService.get<string>('RPC_URL');
    const tokenAddress = this.configService.get<string>('COFFEE_TOKEN_ADDRESS');

    if (!rpcUrl) throw new Error('RPC_URL not set in .env');
    if (!tokenAddress) throw new Error('COFFEE_TOKEN_ADDRESS not set in .env');

    // Providers
    this.httpProvider = new ethers.JsonRpcProvider(rpcUrl);
    this.wsProvider = new ethers.WebSocketProvider(rpcUrl.replace('https://', 'wss://'));

    // ERC20 Transfer ABI
    const erc20Abi = ["event Transfer(address indexed from, address indexed to, uint256 value)"];
    this.tokenContractHTTP = new ethers.Contract(tokenAddress, erc20Abi, this.httpProvider);
    this.tokenContractWS = new ethers.Contract(tokenAddress, erc20Abi, this.wsProvider);

    // Récupérer dernier bloc indexé
    const latestTransfer = await this.dataSource.getRepository(TransferEntity)
      .createQueryBuilder('t')
      .orderBy('t.blockNumber', 'DESC')
      .getOne();
    this.lastIndexedBlock = latestTransfer?.blockNumber || 0;

    console.log(`📌 Starting indexer from block ${this.lastIndexedBlock}`);

    // Indexation historique
    await this.indexHistorical();

    // Écoute en temps réel
    this.listenRealtime();
  }

  private async indexHistorical() {
    const latestBlock = await this.httpProvider.getBlockNumber();
    if (this.lastIndexedBlock >= latestBlock) return;

    console.log(`📌 Fetching historical transfers from ${this.lastIndexedBlock + 1} to ${latestBlock}`);

    const filter = this.tokenContractHTTP.filters.Transfer();

    for (let start = this.lastIndexedBlock + 1; start <= latestBlock; start += this.BATCH_SIZE) {
      const end = Math.min(start + this.BATCH_SIZE - 1, latestBlock);
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
          block: event.blockNumber,
        });
      } catch (err) {
        console.error('Error saving transfer:', err);
      }
    });

    // Reconnexion WS robuste
    (this.wsProvider.websocket as any).on('close', async () => {
      console.log('⚡ WebSocket closed. Reconnecting...');
      setTimeout(() => this.listenRealtime(), 2000);
    });
  }

  private async saveEvent(event: any) {
    const block = await this.httpProvider.getBlock(event.blockNumber);
    if (!block) throw new Error(`Block ${event.blockNumber} not found`);

    const repo = this.dataSource.getRepository(TransferEntity);
    const transfer = repo.create({
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      blockTimestamp: block.timestamp,
      logIndex: event.logIndex,
      tokenAddress: event.address,
      from: event.args?.from,
      to: event.args?.to,
      value: BigInt(event.args?.value?.toString() || '0'),
    });

    await repo.save(transfer);
  }
}
