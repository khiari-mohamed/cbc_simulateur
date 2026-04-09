SELECT c.name, dc."maxCapitalPercent" 
FROM dc_configs dc 
JOIN companies c ON dc."companyId" = c.id;