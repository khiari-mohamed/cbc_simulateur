UPDATE dc_configs 
SET "maxCapitalPercent" = 50.00 
WHERE "companyId" = (SELECT id FROM companies WHERE name = 'AL BARAKA');