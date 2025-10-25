import { Module } from '@nestjs/common';
import { OracleService } from './oracle.service';
import { OracleController } from './oracle.controllers';

@Module({
  providers: [OracleService],
   controllers: [OracleController],
  exports: [OracleService],
})
export class OracleModule {}
