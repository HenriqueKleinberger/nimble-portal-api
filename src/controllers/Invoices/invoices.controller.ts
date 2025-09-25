import {
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { InvoicesService } from '../../services/invoices/invoices.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadCsvResponseDto } from 'src/services/invoices/dto/UploadCsvResponseDto';
import { ApiBody, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { QueryFiltersDto } from './dto/QueryFiltersDto';
import {
  ByStatusResponseDto,
  BySupplierResponseDto,
  MonthlyTotalsResponseDto,
  OverdueTrendOverTimeResponseDto,
} from './dto/ApiResponsesDto';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('upload-svc')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadCsvResponseDto> {
    return await this.invoicesService.uploadCsv(file);
  }

  @Get('overdue-trend-overtime')
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'supplierId', required: false, type: String })
  async getOverdueTrendOverTime(
    @Query() filters: QueryFiltersDto,
  ): Promise<OverdueTrendOverTimeResponseDto[]> {
    return this.invoicesService.getOverdueTrendOverTime(filters);
  }

  @Get('by-status')
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'supplierId', required: false, type: String })
  async getByStatus(
    @Query() filters: QueryFiltersDto,
  ): Promise<ByStatusResponseDto[]> {
    return this.invoicesService.getByStatus(filters);
  }

  @Get('monthly-totals')
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'supplierId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getMonthlyTotals(
    @Query() filters: QueryFiltersDto,
  ): Promise<MonthlyTotalsResponseDto[]> {
    return this.invoicesService.getMonthlyTotals(filters);
  }

  @Get('by-supplier')
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'supplierId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getTotalAmountBySupplier(
    @Query() filters: QueryFiltersDto,
  ): Promise<BySupplierResponseDto[]> {
    return this.invoicesService.getTotalAmountBySupplier(filters);
  }
}
