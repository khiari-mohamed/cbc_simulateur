SELECT 
  c.name AS company,
  dct."minAmount",
  dct."maxAmount",
  dct."step",
  dct."isActive"
FROM dc_capital_tiers dct
JOIN companies c ON dct."companyId" = c.id
WHERE dct."isActive" = true
ORDER BY c.name, dct."minAmount";