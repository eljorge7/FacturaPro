import { Module } from '@nestjs/common';
import { PublicStoreService } from './public-store.service';
import { PublicStoreController } from './public-store.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-jwt-key',
      signOptions: { expiresIn: '7d' },
    })
  ],
  controllers: [PublicStoreController],
  providers: [PublicStoreService],
})
export class PublicStoreModule {}
