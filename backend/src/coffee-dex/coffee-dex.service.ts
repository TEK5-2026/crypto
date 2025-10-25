import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, parseUnits } from 'ethers';
import { parseEther } from 'ethers';
import CoffeeDEX_ABI from './CoffeeDEX.abi.json';

@Injectable()
export class CoffeeDexService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor(private configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('RPC_URL');
    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    const contractAddress = this.configService.get<string>('COFFEE_DEX_ADDRESS');

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey!, this.provider);
    this.contract = new ethers.Contract(contractAddress!, CoffeeDEX_ABI, this.wallet); // Utiliser CoffeeDEX_ABI directement
  }

  async addLiquidity(tokenAmount: number, ethAmount: number): Promise<string> {
    const tx = await this.contract.addLiquidity(tokenAmount, { value: parseEther(ethAmount.toString()) });
    await tx.wait();
    return tx.hash;
  }

  async swapEthToToken(ethAmount: number): Promise<string> {
    const tx = await this.contract.swapEthToToken({ value: parseEther(ethAmount.toString()) });
    await tx.wait();
    return tx.hash;
  }

  async swapTokenToEth(tokenAmount: number): Promise<string> {
    const TOKEN_DECIMALS = 18; 

    const tokenAmountInSmallestUnit = parseUnits(
      tokenAmount.toString(), 
      TOKEN_DECIMALS
    );

    const tx = await this.contract.swapTokenToEth(tokenAmountInSmallestUnit);
    await tx.wait();
    return tx.hash;
  }
}