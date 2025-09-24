import { Module } from '@nestjs/common';
import { InvoicesController } from './controllers/Invoices/invoices.controller';
import { InvoicesService } from './services/invoices/invoices.service';
import { SuppliersService } from './services/suppliers/suppliers.service';
import { PrismaService } from './services/database/prisma.service';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { CurrencyService } from './services/currencies/currencies.service';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [CacheModule.register({ ttl: 5000 }), ConfigModule.forRoot()],
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    SuppliersService,
    PrismaService,
    CurrencyService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
