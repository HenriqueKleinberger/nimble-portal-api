import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from '../../services/invoices/invoices.service';
import { UploadCsvResponseDto } from 'src/services/invoices/dto/UploadCsvResponseDto';
import { QueryFiltersDto } from './dto/QueryFiltersDto';

describe('InvoicesController', () => {
  let controller: InvoicesController;
  let service: InvoicesService;

  const mockInvoicesService = {
    uploadCsv: jest.fn(),
    getOverdueTrendOverTime: jest.fn(),
    getByStatus: jest.fn(),
    getMonthlyTotals: jest.fn(),
    getTotalAmountBySupplier: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [{ provide: InvoicesService, useValue: mockInvoicesService }],
    }).compile();

    controller = module.get<InvoicesController>(InvoicesController);
    service = module.get<InvoicesService>(InvoicesService);
  });

  it('should call uploadCsv', async () => {
    const file = {
      buffer: Buffer.from('test'),
      originalname: 'file.csv',
    } as Express.Multer.File;
    const result: UploadCsvResponseDto = { invoicesUpserted: 1, errors: [] };

    mockInvoicesService.uploadCsv.mockResolvedValue(result);

    expect(await controller.uploadCsv(file)).toEqual(result);
    expect(service.uploadCsv).toHaveBeenCalledWith(file);
  });

  it('should call getOverdueTrendOverTime', async () => {
    const filters: QueryFiltersDto = { from: '2024-01-01', to: '2024-12-31' };
    const result = [{ month: '1/2024', totalAmount: 100 }];

    mockInvoicesService.getOverdueTrendOverTime.mockResolvedValue(result);

    expect(await controller.getOverdueTrendOverTime(filters)).toEqual(result);
    expect(service.getOverdueTrendOverTime).toHaveBeenCalledWith(filters);
  });

  it('should call getByStatus', async () => {
    const filters: QueryFiltersDto = { status: 'CANCELLED' };
    const result = [{ status: 'cancelled', totalAmount: 500 }];

    mockInvoicesService.getByStatus.mockResolvedValue(result);

    expect(await controller.getByStatus(filters)).toEqual(result);
    expect(service.getByStatus).toHaveBeenCalledWith(filters);
  });

  it('should call getMonthlyTotals', async () => {
    const filters: QueryFiltersDto = {};
    const result = [{ month: '2/2024', totalAmount: 200 }];

    mockInvoicesService.getMonthlyTotals.mockResolvedValue(result);

    expect(await controller.getMonthlyTotals(filters)).toEqual(result);
    expect(service.getMonthlyTotals).toHaveBeenCalledWith(filters);
  });

  it('should call getTotalAmountBySupplier', async () => {
    const filters: QueryFiltersDto = { supplierId: 'abc' };
    const result = [{ supplierId: 'abc', totalAmount: 300 }];

    mockInvoicesService.getTotalAmountBySupplier.mockResolvedValue(result);

    expect(await controller.getTotalAmountBySupplier(filters)).toEqual(result);
    expect(service.getTotalAmountBySupplier).toHaveBeenCalledWith(filters);
  });
});
