CREATE OR REPLACE VIEW "InvoiceMonthly" AS
  SELECT
    EXTRACT(MONTH FROM i.date) AS month,
    EXTRACT(YEAR FROM i.date) AS year,
    i.cost,
    i.status,
    i."supplierId",
    s.name AS supplierName,
    i.currency
FROM "Invoice" i
INNER JOIN "Supplier" s ON i."supplierId" = s.id;