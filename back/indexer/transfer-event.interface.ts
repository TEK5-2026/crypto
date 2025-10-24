export interface TransferEvent {
  transactionHash: string;
  blockNumber: number;
  blockTimestamp: number;
  logIndex: number;
  tokenAddress: string;
  from: string;
  to: string;
  value: bigint;
}
