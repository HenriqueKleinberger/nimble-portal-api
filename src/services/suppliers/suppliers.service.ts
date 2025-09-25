import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Supplier } from '@prisma/client';
import { CsvRow, InvoiceCsvMapper } from '../invoices/csv/invoice-csv.mapper';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async saveEditSupplier(row: CsvRow) {
    const supplierData = InvoiceCsvMapper.mapToSupplier(row);
    await this.upsertByInternalId(row.supplier_internal_id, supplierData);
  }
  private async upsertByInternalId(internalId: string, supplierData: Supplier) {
    await this.prisma.supplier.upsert({
      where: { id: internalId },
      update: supplierData,
      create: supplierData,
    });
  }
}
