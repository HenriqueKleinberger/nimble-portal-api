import { Module } from '@nestjs/common';
import { InvoicesController } from './controllers/Invoices/invoices.controller';
import { InvoicesService } from './services/invoices/invoices.service';
import { SuppliersService } from './services/suppliers/suppliers.service';
import { PrismaService } from './services/database/prisma.service';

@Module({
  imports: [],
  controllers: [InvoicesController],
  providers: [InvoicesService, SuppliersService, PrismaService],
})
export class AppModule {}
