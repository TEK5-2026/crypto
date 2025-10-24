import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<JwtModuleOptions> => {
        const secret = config.get<string>('JWT_SECRET') || 'dev_fallback_secret';
        const expiresIn = config.get<string>('JWT_EXPIRES_IN', '1h');
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as unknown as number | string,
          },
        } as JwtModuleOptions;
      },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
