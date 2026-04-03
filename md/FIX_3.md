# FIX 3 — Convention Auto-Detection and Coverage Step Display

## Client issue

After logging in as a member of a convention using organization code + join key, the client still saw a convention selection area during the coverage step.

Client expectation:
- if the user already belongs to a convention through their organization, the app should detect it automatically
- the user should not have to choose again
- when there is exactly one accessible convention, it should be displayed clearly as a badge/read-only state
- the dropdown should only appear if the user truly has multiple conventions to choose from

---

## Important project constraint

This application does **not** rely on seed data.

Everything is entered manually by the client in production-like usage:
- organizations
- join keys
- conventions
- companies
- pricing
- availability
- bundlings
- all admin-managed configuration

Because of that, the fix had to:
- avoid all seed assumptions
- work with real manually entered data
- be safe in both development and production
- use the real source of truth from the backend

---

## Relevant files reviewed

### Frontend
- `frontend/src/components/simulations/CoverageSelectionStep.tsx`
- `frontend/src/pages/simulations/NewSimulationPage.tsx`
- `frontend/src/components/simulations/QuoteGenerationStep.tsx`
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/types/index.ts`
- `frontend/src/lib/api/client.ts`
- `frontend/src/pages/auth/RegisterPage.tsx`
- `frontend/src/components/ui/Select.tsx`

### Backend
- `backend/prisma/schema.prisma`
- `backend/src/users/users.service.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/jwt.strategy.ts`
- `backend/src/conventions/conventions.controller.ts`
- `backend/src/conventions/conventions.service.ts`
- `backend/src/client-organizations/client-organizations.service.ts`
- `backend/src/simulations/simulations.service.ts`

---

## Business/data model understanding

The real relationship is:

- `User.organizationId` links the user to a `ClientOrganization`
- A `ClientOrganization` can access conventions in 2 ways:
  1. **Primary conventions** it owns directly via `Convention.organizationId`
  2. **Shared conventions** via `ConventionOrganization`

The coverage step frontend depends on authenticated user data:
- `AuthContext` calls `/auth/me`
- `CoverageSelectionStep.tsx` reads `user.organization.conventions`
- UI behavior:
  - 1 convention → show badge
  - 2+ conventions → show dropdown
  - 0 conventions → show nothing

So if `/auth/me` does not expose all accessible conventions correctly, the coverage step cannot render the right UI.

---

## Root cause

The backend user payload returned by `/auth/me` only included:

- conventions directly owned by the user’s organization

It did **not** include:
- conventions shared with the user’s organization via `ConventionOrganization`

That means a user could be validly linked to an organization and have access to a convention in the business logic, while the frontend still saw:

- `user.organization.conventions = []`

Result:
- no badge
- no dropdown
- no visible convention section

So the problem was **not** primarily the badge UI.
The real issue was the authenticated payload missing shared convention access.

---

## Surgical fix applied

### File changed
- `backend/src/users/users.service.ts`

### Method updated
- `findById(id: string)`

### What was changed
The method now loads:
- active primary conventions of the user’s organization
- active shared conventions of the user’s organization

Then it:
- merges both lists
- deduplicates them by convention id
- returns them in the same frontend-compatible shape under:
  - `organization.conventions`

### Final behavior of `/auth/me`
Now the frontend receives a unified list of accessible conventions for the logged-in user:
- direct conventions
- shared conventions

That makes the existing coverage-step logic work correctly.

---

## Why this fix is correct

### 1. It fixes the real source of truth
Instead of forcing UI workarounds, it corrects the authenticated user payload.

### 2. It matches backend access rules
`ConventionsService.findByUser()` already uses both:
- primary conventions
- shared conventions

Now `/auth/me` is aligned with that same access model.

### 3. It is safe for manual data entry
No assumptions about seeded organizations or conventions were introduced.

### 4. It is production-safe
The change is small, isolated, and based on actual relational data already used by the backend.

### 5. It preserves frontend compatibility
The frontend contract remains:
- `organization.id`
- `organization.name`
- `organization.code`
- `organization.conventions`

So the UI does not need a risky broad refactor.

---

## Expected UI behavior now

### Case 1 — user has exactly 1 accessible convention
The coverage step should:
- auto-detect it
- auto-apply it
- show a read-only badge
- not show a dropdown

### Case 2 — user has multiple accessible conventions
The coverage step should:
- show a dropdown
- let the user choose which convention to use for this quote

### Case 3 — user has no accessible convention
The coverage step should:
- show nothing related to convention

---

## Code change summary

Before:
- `/auth/me` exposed only organization-owned conventions

After:
- `/auth/me` exposes organization-owned + shared conventions
- both are filtered to active records
- duplicates are removed
- response shape remains compatible with frontend

---

## Validation steps

After backend restart, validate like this:

1. log out
2. log back in
3. open browser devtools
4. inspect the `/auth/me` response
5. verify:
   - `organization` exists
   - `organization.conventions` contains the expected convention(s)
6. go to `Nouvelle Simulation`
7. reach the coverage step

Expected:
- if exactly one convention is accessible → badge appears
- if multiple conventions are accessible → dropdown appears
- if none → no convention section

---

## If it still does not appear

Then the issue is likely data-related, not code-related.

Check:
- the user is linked to the correct organization
- the organization is active
- the convention is active
- the convention is either:
  - owned by the organization, or
  - shared with the organization
- the user session was refreshed after the backend fix

---

## Final conclusion

Fix 3 was not just a display issue.

The true issue was that authenticated user data did not include all convention access paths.  
The fix now ensures convention detection is based on the correct organization-to-convention relationships, including shared conventions, which allows the coverage step to behave exactly as intended with manual client-managed data.
