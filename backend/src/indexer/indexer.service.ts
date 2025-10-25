import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ethers, Interface, Log } from 'ethers';
import { TransferEvent } from './transfer.entity.js';
import { QueryTransferDto } from './dto/query-transfer.dto.js';

const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];
const ERC20_IFACE = new Interface(ERC20_ABI);
const transferEventFragment = ERC20_IFACE.getEvent('Transfer');

@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);
  private provider: ethers.JsonRpcProvider;
  private tokenAddress: string;
  private startBlock: number;
  private isSyncing = false;
  private readonly transferTopic: string;
  private readonly maxBlockRange = 9;

  constructor(
    @InjectRepository(TransferEvent)
    private transferRepository: Repository<TransferEvent>,
    private configService: ConfigService,
  ) {
    const nodeUrl = this.configService.get<string>('RPC_URL');
    const tokenAddress = this.configService.get<string>('COFFEE_TOKEN_ADDRESS');
    const startBlock = this.configService.get<number>('INDEXER_START_BLOCK');

    if (!nodeUrl || !tokenAddress || startBlock === undefined) {
      this.logger.error(
        'RPC_URL, COFFEE_TOKEN_ADDRESS, ou INDEXER_START_BLOCK manquant dans .env',
      );
      throw new Error('Configuration de l\'indexeur manquante.');
    }

    if (!transferEventFragment) {
      throw new Error("Impossible de trouver l'événement 'Transfer' dans l'ABI.");
    }
    this.transferTopic = transferEventFragment.topicHash;

    this.provider = new ethers.JsonRpcProvider(nodeUrl);
    this.tokenAddress = tokenAddress;
    this.startBlock = startBlock;

    this.logger.log(`Indexer initialisé pour le token: ${this.tokenAddress}`);
    this.logger.log(`Topic Transfer: ${this.transferTopic}`);
    
    this.syncEvents();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  handleCron() {
    this.logger.log('Lancement de la synchronisation (Cron)...');
    this.syncEvents();
  }

  async syncEvents() {
    if (this.isSyncing) {
      this.logger.warn('Synchronisation déjà en cours.');
      return;
    }
    this.isSyncing = true;
    this.logger.log('Début de la synchronisation des événements...');

    try {
      // 1. Déterminer la plage totale à synchroniser
      const fromBlock = await this.getLastSyncedBlock();
      const latestBlock = await this.provider.getBlockNumber();

      if (fromBlock > latestBlock) {
        this.logger.log('Base de données à jour.');
        this.isSyncing = false;
        return;
      }

      this.logger.log(`Plage totale à synchroniser: ${fromBlock} à ${latestBlock}`);

      // 2. Boucler à travers la plage totale par "chunks"
      let currentBlock = fromBlock;
      while (currentBlock <= latestBlock) {
        // Détermine la fin du chunk actuel
        const toBlock = Math.min(
          currentBlock + this.maxBlockRange,
          latestBlock,
        );

        this.logger.log(`Traitement du chunk: ${currentBlock} à ${toBlock}...`);

        const filter = {
          address: this.tokenAddress,
          fromBlock: '0x' + currentBlock.toString(16),
          toBlock: '0x' + toBlock.toString(16),
          topics: [this.transferTopic],
        };

        const logs = await this.provider.getLogs(filter);

        if (logs.length > 0) {
          this.logger.log(`${logs.length} événements trouvés dans ce chunk.`);
          const events = await Promise.all(
            logs.map((log) => this.parseLog(log)),
          );
          
          const validEvents = events.filter(
            (event) => event !== null,
          ) as Omit<TransferEvent, 'id'>[];

          if (validEvents.length > 0) {
            await this.saveEvents(validEvents);
          }
        }

        // Passer au chunk suivant
        currentBlock = toBlock + 1;
      }
      
      this.logger.log('Synchronisation historique terminée.');

    } catch (error) {
      this.logger.error('Erreur durant la synchronisation:');
      this.logger.error(error.message, error.stack);
    } finally {
      this.isSyncing = false;
    }
  }

  private async parseLog(log: Log): Promise<Omit<TransferEvent, 'id'> | null> {
    const parsedLog = ERC20_IFACE.parseLog(log);
    const block = await this.provider.getBlock(log.blockNumber);

    if (!block || !parsedLog) {
      this.logger.warn(`Impossible de parser le log ou le bloc: ${log.transactionHash}`);
      return null;
    }

    return {
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      blockTimestamp: block.timestamp,
      logIndex: log.index,
      tokenAddress: log.address,
      from: parsedLog.args.from,
      to: parsedLog.args.to,
      value: parsedLog.args.value,
    };
  }

  private async saveEvents(events: Omit<TransferEvent, 'id'>[]) {
    this.logger.log(`Sauvegarde de ${events.length} événements...`);
    
    const entities = this.transferRepository.create(events);
    await this.transferRepository
      .createQueryBuilder()
      .insert()
      .into(TransferEvent)
      .values(entities)
      .onConflict(`("transactionHash", "logIndex") DO NOTHING`)
      .execute();
      
    this.logger.log('Événements sauvegardés.');
  }

  private async getLastSyncedBlock(): Promise<number> {
    try {
      const lastEvents = await this.transferRepository.find({
        order: { blockNumber: 'DESC' }, // Trier par bloc, du plus récent au plus ancien
        take: 1, // Ne prendre que le premier (le plus récent)
      });

      if (lastEvents.length > 0) {
        const lastEvent = lastEvents[0]; // On prend le premier élément
        return lastEvent.blockNumber + 1;
      }
      
    } catch (e) {
      this.logger.error('Erreur en récupérant le dernier bloc:', e);
    }
    return this.startBlock || 0; 
  }

  async findTransfers(query: QueryTransferDto): Promise<TransferEvent[]> {
    const where: FindOptionsWhere<TransferEvent> = {};
    
    if (query.sender) where.from = query.sender;
    if (query.receiver) where.to = query.receiver;
    if (query.token) where.tokenAddress = query.token;
    if (query.transactionHash) where.transactionHash = query.transactionHash;
    if (query.blockNumber) where.blockNumber = query.blockNumber;
    if (query.value) where.value = query.value;

    if (query.startBlock && query.endBlock) {
      where.blockNumber = Between(query.startBlock, query.endBlock);
    } else if (query.startBlock) {
      where.blockNumber = Between(query.startBlock, 999999999);
    } else if (query.endBlock) {
      where.blockNumber = Between(0, query.endBlock);
    }

    return this.transferRepository.find({
      where: where,
      order: { blockNumber: 'DESC' },
      take: 100,
    });
  }
}