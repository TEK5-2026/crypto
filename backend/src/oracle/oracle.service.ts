import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as PriceOracleABI from './PriceOracle.abi.json';

const abi = (PriceOracleABI as any).default || PriceOracleABI;

@Injectable()
export class OracleService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private oracleContract: ethers.Contract;

  constructor(private configService: ConfigService) {   
    const rpcUrl = this.configService.get<string>('RPC_URL');
    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    const oracleAddress = this.configService.get<string>('ORACLE_CONTRACT_ADDRESS');

    if (!rpcUrl || !privateKey || !oracleAddress) {
      throw new Error('Missing RPC_URL, PRIVATE_KEY or ORACLE_CONTRACT_ADDRESS in .env');
    }

    // extract ABI array from JSON artifact (supports { abi: [...] } or default export)
    const abi: any = (PriceOracleABI as any).abi || (PriceOracleABI as any).default || PriceOracleABI;

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.oracleContract = new ethers.Contract(oracleAddress, abi, this.wallet);
  }

  async getPrice(): Promise<number> {
    const price: bigint = await this.oracleContract.getPrice();
    return Number(price);
  }

  async updatePrice(newPrice: number): Promise<string> {
    const tx = await this.oracleContract.updatePrice(newPrice);
    await tx.wait();
    return tx.hash;
  }
}
