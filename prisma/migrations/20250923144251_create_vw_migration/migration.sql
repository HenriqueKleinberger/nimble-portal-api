
CREATE OR REPLACE VIEW "public"."VwInvoice" AS
SELECT
    EXTRACT(MONTH FROM i."dueDate") AS month,
    EXTRACT(YEAR FROM i."dueDate") AS year,
    i.cost,
    case
        when i."dueDate" < (NOW() AT TIME ZONE 'UTC') and LOWER(i.status) = 'pending' then 'OVERDUE'
        else i.status
    end as status,
    i."supplierId",
    s.name AS "supplierName",
    i.currency,
    i."dueDate" as "dueDate"
    FROM "Invoice" i
INNER JOIN "Supplier" s ON i."supplierId" = s.id;