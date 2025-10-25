import { Entity, PrimaryGeneratedColumn, Column, Index, Unique } from 'typeorm';

@Entity({ name: 'transfer_events' })
@Unique(['transactionHash', 'logIndex']) // Empêche les doublons
export class TransferEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  transactionHash: string;

  @Column()
  @Index()
  blockNumber: number;

  @Column()
  blockTimestamp: number;

  @Column()
  logIndex: number;

  @Column()
  @Index()
  tokenAddress: string;

  @Column()
  @Index()
  from: string;

  @Column()
  @Index()
  to: string;

  // TypeORM gère la conversion entre 'bigint' JS et le type SQL approprié
  @Column('bigint') 
  value: bigint; 
}