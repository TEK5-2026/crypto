import {
  IsOptional,
  IsString,
  IsNumber,
  IsEthereumAddress,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTransferDto {
  @IsOptional()
  @IsEthereumAddress()
  sender?: string;

  @IsOptional()
  @IsEthereumAddress()
  receiver?: string;

  @IsOptional()
  @Type(() => BigInt) // Transforme la string en bigint
  value?: bigint;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  startBlock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  endBlock?: number;

  @IsOptional()
  @IsEthereumAddress()
  token?: string;

  @IsOptional()
  @IsString()
  transactionHash?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  blockNumber?: number;
}