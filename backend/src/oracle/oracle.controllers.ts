import { Controller, Post, Body, Get, Param, Request } from '@nestjs/common';
import { OracleService } from './oracle.service';

@Controller('oracle')
export class OracleController {
  constructor(private readonly oracleService: OracleService) {}

  @Post('update')
  async update(@Body() body: { price: number}) {
    return this.oracleService.updatePrice(body.price);
  }

  @Get('price')
  async get(@Request() req) {
    return this.oracleService.getPrice();
  }
}
