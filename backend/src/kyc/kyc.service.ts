import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as KYC_ABI from './KYC.abi.json';

const abi = (KYC_ABI as any).default || KYC_ABI;

@Injectable()
export class KycService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor(private configService: ConfigService) {
    console.log('KYC_ABI type:', typeof KYC_ABI);
    console.log('KYC_ABI keys:', Object.keys(KYC_ABI));

    const rpcUrl = this.configService.get<string>('RPC_URL');
    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey!, this.provider);
    this.contract = new ethers.Contract(contractAddress!, abi, this.wallet);

  }

  async whitelistAddress(address: string, allowed: boolean) {
    const tx = await this.contract.setWhitelist(address, allowed);
    await tx.wait();
    return { txHash: tx.hash };
  }

  async blacklistAddress(address: string, blocked: boolean) {
    const tx = await this.contract.setBlacklist(address, blocked);
    await tx.wait();
    return { txHash: tx.hash };
  }

  async isAllowed(address: string): Promise<boolean> {
    return await this.contract.isAllowed(address);
  }
}
