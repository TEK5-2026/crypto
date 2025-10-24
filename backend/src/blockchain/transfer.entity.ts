import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('transfers')
export class TransferEntity {
  @PrimaryColumn()
  transactionHash: string;

  @Column()
  blockNumber: number;

  @Column()
  blockTimestamp: number;

  @Column()
  logIndex: number;

  @Column()
  tokenAddress: string;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column('numeric', { transformer: { 
    from: (v: string) => BigInt(v), 
    to: (v: bigint) => v.toString() 
  }})
  value: bigint;
}
