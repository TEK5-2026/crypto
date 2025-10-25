import * as crypto from 'crypto';

if (!(global as any).crypto) {
  (global as any).crypto = crypto.webcrypto;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';


dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Ajout de la configuration CORS
  app.enableCors({
    origin: ['http://localhost:5173'], // Frontend Vite default port
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
