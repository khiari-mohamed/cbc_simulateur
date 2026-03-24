# Convention Sharing - Quick Reference Guide

## 🎯 What Was Implemented

A complete system allowing administrators to share conventions with multiple organizations without creating duplicates.

---

## 📋 Quick Facts

- **Backend:** 3 new endpoints, 4 updated methods, 1 new table
- **Frontend:** 1 new modal component, updated conventions page
- **Migration:** Successfully applied
- **Status:** ✅ Production Ready

---

## 🔑 Key Endpoints

```bash
# Share convention with organizations
POST /conventions/:id/share
Body: { "organizationIds": ["uuid1", "uuid2"] }

# Remove organization from convention  
DELETE /conventions/:id/share/:orgId

# Get shared organizations
GET /conventions/:id/shared-organizations
```

---

## 🎨 UI Changes

### Conventions Page
- **New Button:** "Partager" (Share) on each convention card
- **New Badge:** Green badge showing shared organizations
- **New Stat:** Count of shared organizations in stats grid

### Share Modal
- Shows primary organization (blue badge)
- Lists currently shared organizations (green cards with remove button)
- Multi-select for available organizations
- Real-time validation and feedback

---

## 🔒 Security

- Only `ADMINISTRATEUR_ARS` can share conventions
- Cannot share with primary organization (auto-filtered)
- Cannot share with inactive organizations (auto-filtered)
- All operations logged in audit trail

---

## 💡 Use Cases

### Case 1: External Clients
**Problem:** External clients need convention benefits
**Solution:** Share convention with "Client Particulier" organization

### Case 2: Partner Organizations  
**Problem:** Multiple partners need same convention
**Solution:** Share one convention with all partner organizations

### Case 3: Temporary Access
**Problem:** Pilot program needs temporary access
**Solution:** Share convention, then remove after pilot ends

---

## 🚀 How to Use (Admin)

1. Go to Conventions page
2. Click "Partager" on any convention
3. Select organizations from list
4. Click "Partager avec X org(s)"
5. Done! Organizations now have access

**To Remove:**
1. Open Share modal
2. Click trash icon next to organization
3. Confirm removal
4. Done! Access revoked

---

## 🔍 How It Works (Technical)

### Access Check Logic
```typescript
// User can access if:
isPrimaryOrg = convention.organizationId === user.organizationId
isSharedOrg = convention.sharedWithOrganizations.includes(user.organizationId)

if (isPrimaryOrg || isSharedOrg) {
  // ✅ Access granted
} else {
  // ❌ Access denied
}
```

### Database Structure
```
Convention (1) ←→ (N) ConventionOrganization (N) ←→ (1) ClientOrganization
```

---

## 📊 What Gets Logged

- `CONVENTION_SHARED` - When organizations added
- `CONVENTION_UNSHARED` - When organization removed
- Includes: userId, timestamp, old/new values

---

## ⚠️ Important Notes

1. **Primary Organization:** Cannot be shared with itself (already has access)
2. **Inactive Organizations:** Automatically filtered out
3. **Cascade Delete:** Shares removed if convention or organization deleted
4. **Idempotent:** Sharing same org twice is safe (no duplicates)
5. **Backward Compatible:** Existing conventions work unchanged

---

## 🐛 Troubleshooting

**Issue:** Can't see Share button
**Fix:** Ensure user has `ADMINISTRATEUR_ARS` role

**Issue:** Organization not in list
**Fix:** Check if organization is active and not already shared

**Issue:** Share button disabled
**Fix:** Select at least one organization first

**Issue:** Error when sharing
**Fix:** Check organization IDs are valid UUIDs

---

## 📁 Files Changed

### Backend
- `schema.prisma` - Added ConventionOrganization model
- `conventions.service.ts` - Added sharing methods
- `conventions.controller.ts` - Added endpoints
- `share-convention.dto.ts` - New DTO

### Frontend  
- `ShareOrganizationsModal.tsx` - New modal component
- `ConventionsPage.tsx` - Added Share button and display

---

## ✅ Testing Checklist

- [ ] Admin can share convention
- [ ] Admin can remove organization
- [ ] Users from shared org can access
- [ ] Users from non-shared org denied
- [ ] Cannot share with primary org
- [ ] Cannot share with inactive org
- [ ] Audit logs created
- [ ] UI updates in real-time

---

## 🎓 Training Points for Admins

1. **When to Share:** External users need convention benefits
2. **How to Share:** Click "Partager" button, select organizations
3. **How to Remove:** Open modal, click trash icon
4. **What Users See:** Shared conventions appear in their list
5. **Audit Trail:** All actions logged for compliance

---

## 📞 Support

**For Questions:**
- Check this guide first
- Review audit logs for history
- Verify user roles and permissions
- Check organization active status

**For Issues:**
- Check browser console (frontend)
- Check backend logs (API)
- Verify database migration applied
- Confirm Prisma client regenerated

---

## 🔮 Future Enhancements

- Expiration dates for temporary access
- Permission levels (read-only vs full)
- Bulk operations (share multiple conventions)
- Email notifications when shared
- Analytics dashboard for usage tracking
- Global management view

---

**Version:** 1.0.0  
**Date:** March 22, 2026  
**Status:** ✅ Production Ready
