# FIX 4 — Blocking error on quote generation: `usageId must be a string`

## Client-reported issue

During quote generation, the client encountered this blocking backend validation error:

- `usageId must be a string`

This issue prevented the simulation from being created and therefore blocked all quote-generation testing.

---

## Important project constraints

This fix was analyzed and implemented with the following constraints in mind:

- the application must work in **production and development**
- there is **no seed-based workflow**
- all business data is **entered manually**
- the fix must be **surgical**
- the fix must **not affect unrelated areas**
- the code must remain **clean, senior-level, and safe**

This is especially important here because usage types are not assumed to exist from seeds.  
They are configured manually in the application and must be consumed dynamically.

---

## Relevant files reviewed

### Backend
- `backend/src/simulations/simulations.controller.ts`
- `backend/src/simulations/create-simulation.dto.ts`
- `backend/src/usage-types/usage-types.controller.ts`
- `backend/src/usage-types/usage-types.service.ts`
- `backend/src/usage-types/usage-types.module.ts`

### Frontend
- `frontend/src/components/simulations/VehicleInfoStep.tsx`
- `frontend/src/contexts/AuthContext.tsx`

---

## What the backend expects

The simulation creation endpoint is:

- `POST /simulations`

It receives `CreateSimulationDto`.

In `backend/src/simulations/create-simulation.dto.ts`, the DTO requires:

- `usageId: string`

That means simulation creation now depends on receiving a **real usage database ID**.

This is correct and aligns with the current domain model:
- usages are database-managed entities
- simulations should reference them by ID
- hardcoded enum-style values are no longer enough

---

## Root cause

The root cause was a mismatch between:

- what the backend expects
- what the frontend sends

### Backend expectation
The backend expects:
- `usageId` = a real string ID from the `Usage` table

### Frontend behavior before fix
The frontend simulation step was still using a legacy hardcoded select option:

- `PRIVATE_BUSINESS`

That value is a legacy code-like value, not a guaranteed database ID.

So the frontend was effectively still operating on an old model:
- “usage is a hardcoded option”

while the backend now operates on the real model:
- “usage must reference a manually created database record by id”

---

## Second underlying issue discovered

While tracing the issue, an additional blocker was identified:

The frontend could not reliably load real usage records because:

- `GET /usage-types`
- `GET /usage-types/:id`

were inside a controller protected with:

- `JwtAuthGuard`
- `RolesGuard`
- `@Roles(Role.ADMINISTRATEUR_ARS)`

That means only admins could read usage types.

But the simulation flow is used by authenticated non-admin users too.

So even if the frontend was corrected to fetch live usage records, those users would still fail to load them.

This means there were actually **two linked issues**:

1. frontend was using legacy hardcoded usage values
2. backend usage read endpoint was too restricted for simulation users

---

## Surgical fixes applied

## 1) Frontend fix

### File changed
- `frontend/src/components/simulations/VehicleInfoStep.tsx`

### Change made
The hardcoded usage select options were replaced with data loaded from:

- `GET /usage-types`

The component now:
- fetches live usage records using `react-query`
- builds select options from manually created usage records
- stores the selected `usage.id`
- sends that selected value forward in the simulation flow

### Why this matters
This ensures the frontend no longer assumes seeded or hardcoded usage values.

Instead, it uses:
- actual live manually entered usage configuration
- the same data model the backend expects

---

## 2) Backend fix

### File changed
- `backend/src/usage-types/usage-types.controller.ts`

### Change made
The controller-level authorization was adjusted:

### Before
The entire controller required:
- authenticated user
- admin role

So both read and write operations were admin-only.

### After
The controller now requires:
- authenticated user (`JwtAuthGuard`) for all routes

And admin-only restrictions are applied only to write actions:
- `POST /usage-types`
- `PATCH /usage-types/:id`
- `DELETE /usage-types/:id`
- `DELETE /usage-types/:id/permanent`
- `PATCH /usage-types/:id/reactivate`

Read actions are now available to any authenticated user:
- `GET /usage-types`
- `GET /usage-types/:id`

### Why this matters
This preserves administrative control over configuration changes, while allowing simulation users to consume manually configured usage records.

That is exactly what the app needs in production:
- admins manage reference data
- authenticated operational users consume that reference data

---

## Final root cause summary

The error surfaced as:

- `usageId must be a string`

But the real business-level issue was:

- the frontend was not using real manually configured usage IDs
- the backend read endpoint prevented non-admin simulation users from loading those usage records

So the issue was not just validation syntax.  
It was a contract mismatch between simulation input and the manually configured reference-data model.

---

## Why this fix is correct

### 1. It respects the no-seed architecture
Nothing in the fix assumes predefined usages exist.

### 2. It respects manual configuration
Usage options are now sourced from the real database.

### 3. It is safe in dev and prod
Both environments use the same runtime-loaded usage records.

### 4. It is surgical
Only the specific simulation usage flow and usage read access were changed.

### 5. It preserves security boundaries
Write operations remain admin-only.

### 6. It aligns frontend and backend contracts
The frontend now sends what the backend actually expects:
- a real `usageId`

---

## Files changed

### Frontend
- `frontend/src/components/simulations/VehicleInfoStep.tsx`

### Backend
- `backend/src/usage-types/usage-types.controller.ts`

---

## Expected behavior after the fix

### For authenticated users creating a simulation
- usage options load correctly from the database
- the selected usage corresponds to a real usage record ID
- simulation creation succeeds
- quote generation can proceed

### For admins
- they still retain full management control over usage records

### For non-admin users
- they can read usage records for simulation purposes
- they cannot modify usage configuration

---

## Validation checklist

After deploying or restarting the backend/frontend, validate the following:

1. log in with a normal authenticated user
2. open the simulation flow
3. verify that the usage dropdown loads actual values
4. select a usage
5. continue to quote generation
6. confirm that the simulation is created successfully
7. confirm that the error `usageId must be a string` no longer appears

### Also verify permissions
- non-admin user can call `GET /usage-types`
- non-admin user cannot create/update/delete usage types
- admin can still fully manage usage types

---

## If anything still fails

The next checks should be data-level and environment-level:

- verify at least one active usage exists in the database
- verify the logged-in user is authenticated correctly
- verify `/usage-types` returns records for that user session
- verify the selected option value is the usage `id`, not the usage `code`
- verify no old cached frontend bundle is still using hardcoded values

---

## Final conclusion

Fix 4 resolves a blocking simulation/quote-generation issue by bringing the usage selection flow back into alignment with the real app architecture:

- no seeds
- manual configuration
- live database-driven reference data
- authenticated access for consumers
- admin-only access for managers

This makes the simulation flow production-safe, development-safe, and consistent with the actual business model of the application.
