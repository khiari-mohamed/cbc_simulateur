# 🗂️ Production Cleanup Scripts - Complete Guide

## 📋 Available Scripts

### 1. **check-data-before-cleanup.ts** 🔍
**Purpose**: Preview what will be deleted before running cleanup

**When to use**: ALWAYS run this first before cleanup

**What it does**:
- Shows count of all data that will be deleted
- Shows count of all configurations that will be preserved
- Lists all admin and gestionnaire accounts
- Provides a safety check before cleanup

**Command**:
```bash
npx ts-node scripts/check-data-before-cleanup.ts
```

**Output**: Detailed report of current database state

---

### 2. **clean-test-data-for-prod.ts** 🧹
**Purpose**: Remove all test data while preserving configurations

**When to use**: After verification and backup, before production deployment

**What it does**:
- Deletes all client accounts (CLIENT_ADHERENT)
- Deletes all simulations, quotes, contracts
- Deletes all documents and uploaded files
- Deletes notifications, payments, audit logs
- **PRESERVES** all admin accounts and configurations

**Command**:
```bash
npx ts-node scripts/clean-test-data-for-prod.ts
```

**Output**: Detailed log of deleted and preserved records

---

### 3. **verify-production-ready.ts** ✅
**Purpose**: Verify database is production-ready after cleanup

**When to use**: ALWAYS run this after cleanup

**What it does**:
- Verifies all test data was removed
- Verifies admin accounts still exist
- Verifies all configurations are intact
- Checks database integrity
- Provides production readiness report

**Command**:
```bash
npx ts-node scripts/verify-production-ready.ts
```

**Output**: Pass/Fail report with detailed checks

---

## 🎯 Complete Workflow

### Step-by-Step Process:

```bash
# 1. Check current state
npx ts-node scripts/check-data-before-cleanup.ts

# 2. Backup database (MANDATORY!)
pg_dump -U postgres -d ars_insurance > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Run cleanup
npx ts-node scripts/clean-test-data-for-prod.ts

# 4. Verify production readiness
npx ts-node scripts/verify-production-ready.ts

# 5. If all checks pass, deploy to production! 🚀
```

---

## 📊 What Each Script Checks

### check-data-before-cleanup.ts
| Category | What it shows |
|----------|---------------|
| ❌ To Delete | Clients, simulations, quotes, contracts, documents |
| ✅ To Keep | Admins, gestionnaires, all configurations |
| 👥 Users | Detailed list of all users by role |

### clean-test-data-for-prod.ts
| Phase | Actions |
|-------|---------|
| Phase 1 | Delete uploaded files (documents/, pdfs/) |
| Phase 2 | Delete database records (clients, simulations, etc.) |
| Phase 3 | Verify remaining data |
| Phase 4 | Show summary report |

### verify-production-ready.ts
| Check | Purpose |
|-------|---------|
| Check 1 | Verify test data removal (should be 0) |
| Check 2 | Verify admin accounts exist (must be > 0) |
| Check 3 | Verify configurations intact (counts) |
| Check 4 | Database integrity (no orphaned records) |

---

## 🔒 Safety Features

### Built-in Protections:
1. ✅ **Role-based deletion**: Only deletes CLIENT_ADHERENT users
2. ✅ **Cascade handling**: Properly handles foreign key relationships
3. ✅ **File preservation**: Keeps .gitkeep files
4. ✅ **Verification steps**: Multiple checks before and after
5. ✅ **Detailed logging**: Every action is logged

### What CANNOT be deleted:
- ❌ Admin accounts (ADMINISTRATEUR_ARS)
- ❌ Gestionnaire accounts (GESTIONNAIRE_VALIDATION_ARS)
- ❌ Companies and their settings
- ❌ Guarantees and pricing rules
- ❌ Conventions and reduction rules
- ❌ DC/BG/AC configurations
- ❌ Usage types and fee configs
- ❌ Formula eligibility rules
- ❌ Guarantee bundlings and availabilities

---

## 📖 Documentation Files

### PRODUCTION_CLEANUP_README.md
Comprehensive guide with:
- Detailed explanations
- Troubleshooting section
- Expected output examples
- Rollback procedures
- Safety checklist

### QUICK_START_CLEANUP.md
Quick reference with:
- 3-step process
- TL;DR instructions
- Common issues
- Quick troubleshooting

### CLEANUP_SCRIPTS_INDEX.md (this file)
Master index with:
- All scripts overview
- Complete workflow
- Safety features
- Quick reference

---

## ⚠️ Important Warnings

### ALWAYS:
- ✅ Backup database before cleanup
- ✅ Run check-data-before-cleanup.ts first
- ✅ Run verify-production-ready.ts after
- ✅ Verify admin accounts exist
- ✅ Get client validation before cleanup

### NEVER:
- ❌ Run cleanup without backup
- ❌ Run cleanup on production with real clients
- ❌ Skip verification steps
- ❌ Proceed if admin accounts missing
- ❌ Run cleanup twice

---

## 🆘 Emergency Rollback

If something goes wrong:

```bash
# Stop the application
pm2 stop all  # or your process manager

# Restore from backup
psql -U postgres -d ars_insurance < backup_YYYYMMDD_HHMMSS.sql

# Restart application
pm2 start all
```

---

## 📞 Support Checklist

Before asking for help:

- [ ] Did you run check-data-before-cleanup.ts?
- [ ] Do you have a database backup?
- [ ] What error message did you see?
- [ ] Did verify-production-ready.ts pass?
- [ ] Are admin accounts still accessible?

---

## 🎯 Success Criteria

Database is production-ready when:

- ✅ 0 client accounts (CLIENT_ADHERENT)
- ✅ 0 simulations
- ✅ 0 quotes
- ✅ 0 contracts
- ✅ 0 documents
- ✅ Admin accounts exist and accessible
- ✅ All configurations intact
- ✅ verify-production-ready.ts passes all checks

---

## 📝 Quick Reference

| Task | Script | Time |
|------|--------|------|
| Check state | check-data-before-cleanup.ts | ~5 sec |
| Backup DB | pg_dump command | ~30 sec |
| Run cleanup | clean-test-data-for-prod.ts | ~10 sec |
| Verify ready | verify-production-ready.ts | ~5 sec |
| **Total** | **Complete workflow** | **~1 min** |

---

**Last Updated**: 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅
