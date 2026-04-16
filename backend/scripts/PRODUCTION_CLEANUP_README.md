# 🧹 Production Cleanup Script

## Overview
This script prepares the database for production deployment by removing all test data while preserving all configurations and admin accounts.

## ⚠️ IMPORTANT WARNINGS

1. **BACKUP FIRST**: Always create a database backup before running this script
2. **ONE-WAY OPERATION**: This script permanently deletes data - it cannot be undone
3. **PRODUCTION ONLY**: Only run this script when deploying to production
4. **VERIFY FIRST**: Review what will be deleted before running

## What Gets DELETED ❌

- **Client accounts** (role: CLIENT_ADHERENT)
- **All simulations** and their guarantees
- **All quotes** and quote items
- **All contracts**
- **All documents** (DB records + uploaded files)
- **All notifications**
- **All payments**
- **All audit logs**
- **All quote comparisons**
- **Client organizations**
- **Uploaded files** in `uploads/documents/` and `uploads/pdfs/`

## What Gets PRESERVED ✅

- **Admin accounts** (ADMINISTRATEUR_ARS)
- **Gestionnaire accounts** (GESTIONNAIRE_VALIDATION_ARS)
- **All companies** and their settings
- **All guarantees** and configurations
- **All pricing rules**
- **All conventions** and reduction rules
- **All DC configurations** (capital tiers, progressive tiers, matrix)
- **All BG capital limits**
- **All AC capital configurations**
- **All usage types** and fee configs
- **All formula eligibility rules**
- **All guarantee bundlings**
- **All guarantee availabilities**
- **All franchise values**

## How to Use

### Step 1: Backup Database
```bash
# PostgreSQL backup
pg_dump -U your_user -d your_database > backup_before_cleanup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Review What Will Be Deleted
```bash
# Check current data counts
cd backend
npx ts-node scripts/check-data-before-cleanup.ts
```

### Step 3: Run the Cleanup Script
```bash
cd backend
npx ts-node scripts/clean-test-data-for-prod.ts
```

### Step 4: Verify Results
The script will automatically display:
- Count of deleted records
- Count of preserved configurations
- Summary of remaining data

## Expected Output

```
🧹 Starting production cleanup...

📁 Step 1: Cleaning uploaded files...
   ✅ Deleted 45 document files
   ✅ Deleted 23 PDF files

🗄️  Step 2: Cleaning database records...
   ✅ Deleted 12 notifications
   ✅ Deleted 5 payments
   ✅ Deleted 234 audit logs
   ✅ Deleted 45 document records
   ✅ Deleted 8 quote comparisons
   ✅ Deleted 3 contracts
   ✅ Deleted 67 quote items
   ✅ Deleted 23 quotes
   ✅ Deleted 89 simulation guarantees
   ✅ Deleted 34 simulations
   ✅ Deleted 34 vehicles
   ✅ Deleted 15 driver profiles
   ✅ Deleted 15 client accounts
   ✅ Deleted 3 client organizations

✅ Step 3: Verifying remaining data...
   👥 Remaining users: 3
      - Admins: 2
      - Gestionnaires: 1
   🏢 Companies: 2
   🛡️  Guarantees: 14
   💰 Pricing rules: 156
   📋 Conventions: 2
   🎯 Reduction rules: 48
   🚗 DC configs: 4
   📊 DC capital tiers: 16
   🪟 BG capital limits: 8
   🚙 Usage types: 2
   💵 Usage fee configs: 4
   📅 Formula eligibility rules: 6
   🔗 Guarantee bundlings: 12
   ✓  Guarantee availabilities: 24

============================================================
🎉 PRODUCTION CLEANUP COMPLETED SUCCESSFULLY!
============================================================

✅ DELETED (Test Data):
   - 15 client accounts
   - 34 simulations
   - 23 quotes
   - 3 contracts
   - 45 documents
   - 12 notifications
   - 5 payments
   - 234 audit logs
   - 3 client organizations
   - All uploaded files (documents & PDFs)

✅ PRESERVED (Configurations):
   - 2 admin accounts
   - 1 gestionnaire accounts
   - 2 companies
   - 14 guarantees
   - 156 pricing rules
   - 2 conventions
   - 48 reduction rules
   - 4 DC configurations
   - 16 DC capital tiers
   - 8 BG capital limits
   - 2 usage types
   - 4 usage fee configs
   - 6 formula eligibility rules
   - 12 guarantee bundlings
   - 24 guarantee availabilities

🚀 Database is ready for production deployment!
============================================================
```

## Troubleshooting

### Error: "Cannot delete records due to foreign key constraints"
- The script handles cascading deletes automatically
- If you see this error, check for custom constraints in your database

### Error: "ENOENT: no such file or directory"
- The uploads directory doesn't exist
- This is normal if no files were uploaded during testing

### Error: "Permission denied"
- Ensure you have write permissions to the uploads directory
- Run with appropriate permissions: `sudo npx ts-node ...` (Linux/Mac)

## Post-Cleanup Checklist

- [ ] Verify admin accounts still exist and can login
- [ ] Verify gestionnaire accounts still exist
- [ ] Check that all pricing rules are intact
- [ ] Verify conventions and reduction rules
- [ ] Test creating a new simulation (should work)
- [ ] Test generating a quote (should work)
- [ ] Verify no client data remains

## Rollback

If something goes wrong:

```bash
# Restore from backup
psql -U your_user -d your_database < backup_before_cleanup_YYYYMMDD_HHMMSS.sql
```

## Safety Features

1. **Explicit role filtering**: Only deletes CLIENT_ADHERENT users
2. **Cascade handling**: Properly handles foreign key relationships
3. **File preservation**: Keeps .gitkeep files in upload directories
4. **Verification step**: Shows what remains after cleanup
5. **Detailed logging**: Every deletion is logged with counts

## When to Run

- ✅ Before first production deployment
- ✅ After completing all testing
- ✅ When client validation is complete
- ❌ Never on a production database with real clients
- ❌ Never without a backup

## Support

If you encounter issues:
1. Check the error message carefully
2. Verify database connection
3. Ensure all migrations are up to date
4. Check file system permissions
5. Review the backup before proceeding

---

**Last Updated**: 2024
**Version**: 1.0.0
