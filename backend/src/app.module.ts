import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndexerService } from './blockchain/indexer.service';
import { TransferEntity } from './blockchain/transfer.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [TransferEntity],
        synchronize: true, // ⚠️ uniquement pour dev, met à false en prod
        logging: true,
      }),
    }),
    TypeOrmModule.forFeature([TransferEntity]),
  ],
  providers: [IndexerService],
})
export class AppModule {}
