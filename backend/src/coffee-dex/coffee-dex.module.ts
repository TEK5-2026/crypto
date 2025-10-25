import { Module } from '@nestjs/common';
import { CoffeeDexService } from './coffee-dex.service';
import { CoffeeDexController } from './coffee-dex.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [CoffeeDexService],
  controllers: [CoffeeDexController],
})
export class CoffeeDexModule {}