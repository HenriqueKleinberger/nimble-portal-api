export class MonthlyTotalsResponseDto {
  month: string;
  year: string;
  supplierId?: string;
  status?: string;
  totalAmount: number;
}
