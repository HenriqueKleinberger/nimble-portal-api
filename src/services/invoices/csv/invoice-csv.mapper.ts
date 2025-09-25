import { Invoice, Supplier } from '@prisma/client';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

const getDateUTC = () => {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds(),
    ),
  );
};

export interface CsvRow {
  invoice_id: string;
  invoice_date: string;
  invoice_due_date: string;
  invoice_cost: string;
  invoice_currency: string;
  invoice_status: string;
  supplier_internal_id: string;
  supplier_external_id: string;
  supplier_company_name: string;
  supplier_address: string;
  supplier_city: string;
  supplier_country: string;
  supplier_contact_name: string;
  supplier_phone: string;
  supplier_email: string;
  supplier_bank_code: string;
  supplier_bank_branch_code: string;
  supplier_bank_account_number: string;
  supplier_status: string;
  supplier_stock_value: string;
  supplier_withholding_tax: string;
}

export class InvoiceCsvMapper {
  static async parseCsv(buffer: Buffer): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
      const records: CsvRow[] = [];
      const stream = Readable.from(buffer.toString());

      stream
        .pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
          }),
        )
        .on('data', (row) => {
          records.push(row as CsvRow);
        })
        .on('end', () => {
          resolve(records);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  static mapToSupplier(row: CsvRow): Supplier {
    return {
      id: row.supplier_internal_id,
      externalId: row.supplier_external_id,
      name: row.supplier_company_name,
      address: row.supplier_address,
      city: row.supplier_city,
      country: row.supplier_country,
      contactName: row.supplier_contact_name,
      phone: row.supplier_phone,
      email: row.supplier_email,
      bankCode: row.supplier_bank_code,
      bankBranchCode: row.supplier_bank_branch_code,
      bankAccountNumber: row.supplier_bank_account_number,
      status: row.supplier_status,
      stockValue: parseFloat(row.supplier_stock_value),
      withholdingTax: parseFloat(row.supplier_withholding_tax),
      createdAt: getDateUTC(),
      updatedAt: getDateUTC(),
    };
  }

  static mapToInvoice(row: CsvRow, supplierId: string): Invoice {
    return {
      id: row.invoice_id,
      date: this.parseDate(row.invoice_date),
      dueDate: this.parseDate(row.invoice_due_date),
      cost: parseFloat(row.invoice_cost),
      currency: row.invoice_currency.toUpperCase(),
      status: row.invoice_status.toUpperCase(),
      supplierId: supplierId,
      createdAt: getDateUTC(),
      updatedAt: getDateUTC(),
    };
  }

  private static parseDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
}
