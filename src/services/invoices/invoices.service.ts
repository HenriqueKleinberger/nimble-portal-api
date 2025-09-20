import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UploadCsvResponseDto } from './dto/UploadCsvResponseDto';
import { CsvRow, InvoiceCsvMapper } from './csv/invoice-csv.mapper';
import { SuppliersService } from '../suppliers/suppliers.service';
import { QueryFiltersDto } from 'src/controllers/Invoices/dto/QueryFiltersDto';
import { MonthlyTotalsResponseDto } from 'src/controllers/Invoices/dto/MonthlyTotalsResponseDto';
import { groupBy } from 'rxjs';

type GroupByOption = 'status' | 'supplierId' | 'month' | 'year';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private suppliersService: SuppliersService,
  ) {}
  async uploadCsv(file: Express.Multer.File): Promise<UploadCsvResponseDto> {
    if (!file) throw new BadRequestException('No file uploaded');

    if (!file.originalname.endsWith('.csv'))
      throw new BadRequestException('File must be a CSV');

    try {
      const csvRows = await InvoiceCsvMapper.parseCsv(file.buffer);
      const result = await this.processCsvRows(csvRows);
      return result;
    } catch (error) {
      throw new BadRequestException(`Error processing CSV: ${error.message}`);
    }
  }

  private async processCsvRows(rows: CsvRow[]): Promise<UploadCsvResponseDto> {
    let invoicesUpserted = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const supplierData = InvoiceCsvMapper.mapToSupplier(row);
        await this.suppliersService.upsertByInternalId(
          row.supplier_internal_id,
          supplierData,
        );

        const invoiceData = InvoiceCsvMapper.mapToInvoice(
          row,
          row.supplier_internal_id,
        );
        await this.prisma.invoice.upsert({
          where: { id: row.invoice_id },
          update: invoiceData,
          create: invoiceData,
        });
        invoicesUpserted++;
      } catch (error) {
        errors.push(`Row ${row.invoice_id}: ${error.message}`);
      }
    }

    return {
      invoicesUpserted,
      errors,
    };
  }

  async getMonthlyTotals(
    filters: QueryFiltersDto,
  ): Promise<MonthlyTotalsResponseDto[]> {
    const where = {
      ...(filters.from && { date: { gte: new Date(filters.from) } }),
      ...(filters.to && { date: { lte: new Date(filters.to) } }),
      ...(filters.status && { status: filters.status }),
      ...(filters.supplierId && { supplierId: filters.supplierId }),
    };

    const groupBy: GroupByOption[] = [];

    const result = await this.prisma.invoiceMonthly.groupBy({
      by: filters.groupBy || ['month', 'year'],
      _sum: {
        cost: true,
      },
      where,
    });

    return result.map((item) => {
      const monthlyTotalsResponseDto: MonthlyTotalsResponseDto =
        {} as MonthlyTotalsResponseDto;
      monthlyTotalsResponseDto.month = item?.month?.toString().padStart(2, '0');
      monthlyTotalsResponseDto.year = item?.year?.toString();
      monthlyTotalsResponseDto.supplierId = item.supplierId;
      monthlyTotalsResponseDto.status = item.status;
      monthlyTotalsResponseDto.totalAmount = item._sum.cost || 0;
      return monthlyTotalsResponseDto;
    });
  }
}
