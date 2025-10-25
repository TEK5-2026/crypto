import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { KycModule } from './kyc/kyc.module';
import { OracleModule } from './oracle/oracle.module';
import { IndexerModule } from './indexer/indexer.module';
import { CoffeeDexModule } from './coffee-dex/coffee-dex.module';

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
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        // ensure entities are registered
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // alternative: autoLoadEntities: true,
        synchronize: true,
        logging: true,
      }),
    }),
    UsersModule,
    AuthModule,
    KycModule,
    OracleModule,
    IndexerModule,
    CoffeeDexModule
  ],
})
export class AppModule {}
