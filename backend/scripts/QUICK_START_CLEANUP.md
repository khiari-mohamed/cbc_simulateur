# 🚀 Quick Start: Production Cleanup

## TL;DR - 3 Simple Steps

### 1️⃣ Check what will be deleted
```bash
cd backend
npx ts-node scripts/check-data-before-cleanup.ts
```

### 2️⃣ Backup database (MANDATORY!)
```bash
# PostgreSQL
pg_dump -U postgres -d ars_insurance > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use your database management tool
```

### 3️⃣ Run cleanup
```bash
cd backend
npx ts-node scripts/clean-test-data-for-prod.ts
```

---

## What Gets Deleted ❌
- Client accounts (test users)
- All simulations
- All quotes & contracts
- All documents & uploaded files
- Notifications, payments, audit logs

## What Stays ✅
- Admin accounts
- Gestionnaire accounts
- ALL configurations (pricing, guarantees, rules, etc.)
- ALL company settings
- ALL conventions & reductions

---

## Safety Checklist

- [ ] Database backup created
- [ ] Verified admin accounts exist (check-data-before-cleanup.ts)
- [ ] Client validation email received
- [ ] Ready to deploy to production

---

## Expected Result

After cleanup:
- ✅ 0 client accounts
- ✅ 0 simulations
- ✅ 0 quotes
- ✅ Admin accounts intact
- ✅ All configurations preserved
- ✅ Ready for production!

---

## Troubleshooting

**"No admin accounts found"**
→ DO NOT RUN CLEANUP! Create admin accounts first.

**"Database already clean"**
→ No action needed. Database is ready.

**"Permission denied on uploads/"**
→ Check file permissions: `chmod -R 755 uploads/`

---

## Rollback

If something goes wrong:
```bash
psql -U postgres -d ars_insurance < backup_YYYYMMDD_HHMMSS.sql
```

---

## Need Help?

1. Read: `PRODUCTION_CLEANUP_README.md` (detailed guide)
2. Check: Output of `check-data-before-cleanup.ts`
3. Verify: Database backup exists before proceeding

---

**⚠️ REMEMBER: Always backup before cleanup!**
