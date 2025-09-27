import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../database/prisma.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { CurrencyService } from '../currencies/currencies.service';
import { BadRequestException } from '@nestjs/common';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let prisma: PrismaService;
  let suppliers: SuppliersService;
  let currency: CurrencyService;

  const mockPrisma = {
    invoice: { upsert: jest.fn() },
    vwInvoice: { groupBy: jest.fn() },
  };

  const mockSuppliers = { saveEditSupplier: jest.fn() };
  const mockCurrency = { getRates: jest.fn(), getRate: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SuppliersService, useValue: mockSuppliers },
        { provide: CurrencyService, useValue: mockCurrency },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    prisma = module.get<PrismaService>(PrismaService);
    suppliers = module.get<SuppliersService>(SuppliersService);
    currency = module.get<CurrencyService>(CurrencyService);
  });

  describe('uploadCsv', () => {
    it('should throw error if no file', async () => {
      await expect(service.uploadCsv(undefined as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if not csv', async () => {
      const file = { originalname: 'file.txt' } as Express.Multer.File;
      await expect(service.uploadCsv(file)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getByStatus', () => {
    it('should group by status and return totals in USD', async () => {
      (mockPrisma.vwInvoice.groupBy as jest.Mock).mockResolvedValue([
        { status: 'CANCELLED', currency: 'USD', _sum: { cost: 100 } },
        { status: 'CANCELLED', currency: 'EUR', _sum: { cost: 200 } },
        { status: 'CONFIRMED', currency: 'EUR', _sum: { cost: 300 } },
      ]);
      mockCurrency.getRates.mockResolvedValue({ USD: '1', EUR: '0.50' });
      (mockCurrency.getRate as jest.Mock).mockImplementation(
        (currency: string) => {
          if (currency === 'USD') return Promise.resolve(1);
          if (currency === 'EUR') return Promise.resolve(0.5);
          return Promise.resolve(undefined);
        },
      );

      const result = await service.getByStatus({});
      expect(result).toEqual([
        { status: 'cancelled', totalAmount: 500 },
        { status: 'confirmed', totalAmount: 600 },
      ]);
    });
  });

  describe('getOverdueTrendOverTime', () => {
    it('should group by month/year', async () => {
      (mockPrisma.vwInvoice.groupBy as jest.Mock).mockResolvedValue([
        { month: 1, year: 2024, currency: 'USD', _sum: { cost: 200 } },
        { month: 1, year: 2024, currency: 'EUR', _sum: { cost: 100 } },
        { month: 2, year: 2024, currency: 'EUR', _sum: { cost: 200 } },
        { month: 1, year: 2025, currency: 'EUR', _sum: { cost: 300 } },
      ]);
      mockCurrency.getRates.mockResolvedValue({ USD: '1', EUR: '0.50' });
      (mockCurrency.getRate as jest.Mock).mockImplementation(
        (currency: string) => {
          if (currency === 'USD') return Promise.resolve(1);
          if (currency === 'EUR') return Promise.resolve(0.5);
          return Promise.resolve(undefined);
        },
      );

      const result = await service.getOverdueTrendOverTime({});
      expect(result).toEqual([
        { month: '1/2024', totalAmount: 400 },
        { month: '2/2024', totalAmount: 400 },
        { month: '1/2025', totalAmount: 600 },
      ]);
    });
  });

  describe('getMonthlyTotals', () => {
    it('should group and aggregate by month', async () => {
      (mockPrisma.vwInvoice.groupBy as jest.Mock).mockResolvedValue([
        { month: 2, year: 2024, currency: 'USD', _sum: { cost: 300 } },
        { month: 2, year: 2024, currency: 'EUR', _sum: { cost: 100 } },
        { month: 3, year: 2024, currency: 'EUR', _sum: { cost: 200 } },
        { month: 2, year: 2025, currency: 'EUR', _sum: { cost: 300 } },
      ]);
      mockCurrency.getRates.mockResolvedValue({ USD: '1', EUR: '0.50' });
      (mockCurrency.getRate as jest.Mock).mockImplementation(
        (currency: string) => {
          if (currency === 'USD') return Promise.resolve(1);
          if (currency === 'EUR') return Promise.resolve(0.5);
          return Promise.resolve(undefined);
        },
      );

      const result = await service.getMonthlyTotals({});
      expect(result).toEqual([
        { month: '2/2024', totalAmount: 500 },
        { month: '3/2024', totalAmount: 400 },
        { month: '2/2025', totalAmount: 600 },
      ]);
    });
  });

  describe('getTotalAmountBySupplier', () => {
    it('should return totals per supplier', async () => {
      (mockPrisma.vwInvoice.groupBy as jest.Mock).mockResolvedValue([
        { supplierId: 'abc', currency: 'USD', _sum: { cost: 400 } },
        { supplierId: 'abc', currency: 'EUR', _sum: { cost: 100 } },
        { supplierId: 'cde', currency: 'EUR', _sum: { cost: 100 } },
      ]);
      mockCurrency.getRates.mockResolvedValue({ USD: '1', EUR: '0.50' });
      (mockCurrency.getRate as jest.Mock).mockImplementation(
        (currency: string) => {
          if (currency === 'USD') return Promise.resolve(1);
          if (currency === 'EUR') return Promise.resolve(0.5);
          return Promise.resolve(undefined);
        },
      );
      const result = await service.getTotalAmountBySupplier({});
      expect(result).toEqual([
        { supplierId: 'abc', totalAmount: 600 },
        { supplierId: 'cde', totalAmount: 200 },
      ]);
    });
  });
});
