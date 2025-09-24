export class ByStatusResponseDto {
  status?: string;
  totalAmount: number;
}

export class OverdueTrendOverTimeResponseDto {
  month?: string;
  totalAmount: number;
}

export class MonthlyTotalsResponseDto {
  month?: string;
  totalAmount: number;
}

export class BySupplierResponseDto {
  supplierId?: string;
  totalAmount: number;
}
