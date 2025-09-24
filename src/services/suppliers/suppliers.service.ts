import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Supplier } from '@prisma/client';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async upsertByInternalId(internalId: string, supplierData: Supplier) {
    await this.prisma.supplier.upsert({
      where: { id: internalId },
      update: supplierData,
      create: supplierData,
    });
  }
}
