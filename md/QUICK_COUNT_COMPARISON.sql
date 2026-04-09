-- QUICK COUNT COMPARISON
-- Run on both databases for fast overview

SELECT 'MIGRATION' AS check_type, 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns 
         WHERE table_name = 'simulations' AND column_name = 'acCapitals'
       ) THEN 'APPLIED' ELSE 'MISSING' END AS status;

SELECT 'COMPANIES' AS table_name, COUNT(*) AS total, 
       COUNT(CASE WHEN "isActive" = true THEN 1 END) AS active FROM companies
UNION ALL
SELECT 'DC_CONFIGS', COUNT(*), COUNT(CASE WHEN "isActive" = true THEN 1 END) FROM dc_configs
UNION ALL  
SELECT 'DC_CAPITAL_TIERS', COUNT(*), COUNT(CASE WHEN "isActive" = true THEN 1 END) FROM dc_capital_tiers
UNION ALL
SELECT 'FRANCHISE_VALUES', COUNT(*), COUNT(CASE WHEN "isActive" = true THEN 1 END) FROM franchise_values
UNION ALL
SELECT 'BG_CAPITAL_LIMITS', COUNT(*), COUNT(CASE WHEN "isActive" = true THEN 1 END) FROM bg_capital_limits
UNION ALL
SELECT 'GUARANTEES', COUNT(*), COUNT(CASE WHEN "isActive" = true THEN 1 END) FROM guarantees
UNION ALL
SELECT 'PRICING_RULES', COUNT(*), COUNT(CASE WHEN "isActive" = true THEN 1 END) FROM pricing_rules
UNION ALL
SELECT 'CONVENTIONS', COUNT(*), COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) FROM conventions;

SELECT 'SIMULATIONS_WITH_AC' AS metric, 
       COUNT(CASE WHEN "acCapitals" IS NOT NULL THEN 1 END) AS count
FROM simulations;