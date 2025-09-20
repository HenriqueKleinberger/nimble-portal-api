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

  //   async findById(id: number): Promise<Supplier> {
  //     return this.supplierRepository.findOne({ where: { id } });
  //   }

  //   async findByInternalId(internalId: string): Promise<Supplier> {
  //     return this.supplierRepository.findOne({ where: { internal_id: internalId } });
  //   }

  //   async findAll(): Promise<Supplier[]> {
  //     return this.supplierRepository.find();
  //   }
}
