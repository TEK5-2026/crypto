import { Controller, Post, Body } from '@nestjs/common';
import { CoffeeDexService } from './coffee-dex.service';

@Controller('coffee-dex')
export class CoffeeDexController {
  constructor(private readonly coffeeDexService: CoffeeDexService) {}

  @Post('add-liquidity')
  async addLiquidity(@Body() body: { tokenAmount: number; ethAmount: number }) {
    return this.coffeeDexService.addLiquidity(body.tokenAmount, body.ethAmount);
  }

  @Post('swap-eth-to-token')
  async swapEthToToken(@Body() body: { ethAmount: number }) {
    return this.coffeeDexService.swapEthToToken(body.ethAmount);
  }

  @Post('swap-token-to-eth')
  async swapTokenToEth(@Body() body: { tokenAmount: number }) {
    return this.coffeeDexService.swapTokenToEth(body.tokenAmount);
  }
}