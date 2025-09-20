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
import { MonthlyTotalsResponseDto } from './dto/MonthlyTotalsResponseDto';

@Controller()
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
          format: 'binary', // REQUIRED for file uploads in Swagger UI
        },
      },
    },
  })
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadCsvResponseDto> {
    return await this.invoicesService.uploadCsv(file);
  }

  @Get('monthly-totals')
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'supplierId', required: false, type: String })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    type: [String],
    description:
      "Array of fields to group by. Allowed values: 'status', 'supplier', 'date'",
  })
  async getMonthlyTotals(
    @Query() filters: QueryFiltersDto,
  ): Promise<MonthlyTotalsResponseDto[]> {
    return this.invoicesService.getMonthlyTotals(filters);
  }
}
