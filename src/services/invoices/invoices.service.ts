import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UploadCsvResponseDto } from './dto/UploadCsvResponseDto';
import { CsvRow, InvoiceCsvMapper } from './csv/invoice-csv.mapper';
import { SuppliersService } from '../suppliers/suppliers.service';
import { CurrencyService } from '../currencies/currencies.service';
import { QueryFiltersDto } from 'src/controllers/Invoices/dto/QueryFiltersDto';
import {
  ByStatusResponseDto,
  BySupplierResponseDto,
  MonthlyTotalsResponseDto,
  OverdueTrendOverTimeResponseDto,
} from 'src/controllers/Invoices/dto/MonthlyTotalsResponseDto';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private suppliersService: SuppliersService,
    private currencyService: CurrencyService,
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

  async getByStatus(filters: QueryFiltersDto): Promise<ByStatusResponseDto[]> {
    const result = await this.prisma.vwInvoice.groupBy({
      by: ['status', 'currency'],
      _sum: {
        cost: true,
      },
      orderBy: { status: 'asc' },
      where: this.getWhereClause(filters),
    });

    await this.currencyService.getRates();

    const totals: Record<string, number> = {};

    for (const item of result) {
      const rate = await this.currencyService.getRate(item.currency);
      const amount = (item._sum.cost || 0) / (rate || 1);
      const status = item.status?.toLowerCase() || 'unknown';

      if (!totals[status]) {
        totals[status] = amount;
      } else {
        totals[status] += amount;
      }
    }

    return Object.keys(totals).map((key) => ({
      status: key,
      totalAmount: parseFloat(totals[key].toFixed(2)),
    }));
  }

  async getOverdueTrendOverTime(
    filters: QueryFiltersDto,
  ): Promise<OverdueTrendOverTimeResponseDto[]> {
    const result = await this.prisma.vwInvoice.groupBy({
      by: ['month', 'year', 'currency'],
      _sum: {
        cost: true,
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
      where: this.getWhereClause({ ...filters, status: 'OVERDUE' }),
    });

    await this.currencyService.getRates();

    const totals: Record<string, number> = {};

    for (const item of result) {
      const rate = await this.currencyService.getRate(item.currency);
      const amount = (item._sum.cost || 0) / (rate || 1);
      const month = `${item.month}/${item.year}`;

      if (!totals[month]) {
        totals[month] = amount;
      } else {
        totals[month] += amount;
      }
    }

    return Object.keys(totals).map((key) => ({
      month: key,
      totalAmount: parseFloat(totals[key].toFixed(2)),
    }));
  }

  async getMonthlyTotals(
    filters: QueryFiltersDto,
  ): Promise<MonthlyTotalsResponseDto[]> {
    const result = await this.prisma.vwInvoice.groupBy({
      by: ['month', 'year', 'currency'],
      _sum: {
        cost: true,
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
      where: this.getWhereClause({ ...filters }),
    });

    await this.currencyService.getRates();

    const totals: Record<string, number> = {};

    for (const item of result) {
      const rate = await this.currencyService.getRate(item.currency);
      const amount = (item._sum.cost || 0) / (rate || 1);
      const month = `${item.month}/${item.year}`;

      if (!totals[month]) {
        totals[month] = amount;
      } else {
        totals[month] += amount;
      }
    }

    return Object.keys(totals).map((key) => ({
      month: key,
      totalAmount: parseFloat(totals[key].toFixed(2)),
    }));
  }

  async getTotalAmountBySupplier(
    filters: QueryFiltersDto,
  ): Promise<BySupplierResponseDto[]> {
    const result = await this.prisma.vwInvoice.groupBy({
      by: ['supplierId', 'currency'],
      _sum: {
        cost: true,
      },
      orderBy: [{ supplierId: 'asc' }],
      where: this.getWhereClause({ ...filters }),
    });

    await this.currencyService.getRates();

    const totals: Record<string, number> = {};

    for (const item of result) {
      const rate = await this.currencyService.getRate(item.currency);
      const amount = (item._sum.cost || 0) / (rate || 1);

      if (!totals[item.supplierId]) {
        totals[item.supplierId] = amount;
      } else {
        totals[item.supplierId] += amount;
      }
    }

    return Object.keys(totals).map((key) => ({
      supplierId: key,
      totalAmount: parseFloat(totals[key].toFixed(2)),
    }));
  }

  private getWhereClause(filters: QueryFiltersDto) {
    return {
      ...(filters.from || filters.to
        ? {
            dueDate: {
              ...(filters.from && { gte: new Date(filters.from) }),
              ...(filters.to && { lte: new Date(filters.to) }),
            },
          }
        : {}),
      ...(filters.status && { status: filters.status }),
      ...(filters.supplierId && {
        supplierId: {
          in: Array.isArray(filters.supplierId)
            ? filters.supplierId
            : [filters.supplierId], // ensure it's always an array
        },
      }),
    };
  }
}
