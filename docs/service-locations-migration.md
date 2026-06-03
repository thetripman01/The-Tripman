# Service Locations Migration — Handoff

## What changed

Customers can no longer free-type a city for pickup. They now pick:

1. **Country** (dropdown)
2. **City** (dropdown, filtered by selected country and the booking date)
3. **Street address** (free text — for the actual address inside the chosen city)

Admin can manage the country/city list from **Admin → Calendar tab → Service Locations** card. Each location supports:

- `isActive` — master enable/disable toggle.
- `availableFrom` / `availableUntil` — optional inclusive date window. Empty = always bookable. Set both for tour windows (e.g. Ottawa Jul 12–14).
- `isDefault` — pre-selects this city in the public form (max one per country).
- `sortOrder` — display order in dropdowns.
- `note` — internal admin notes.

The booking API server-side re-validates the chosen country/city against the active list and the booking date, so direct API calls bypassing the dropdown are rejected with 400.

## Files added / changed

**Added**

- `src/lib/service-locations.ts` — availability + matching + display helpers
- `src/app/api/service-locations/route.ts` — public GET (unauthenticated)
- `src/app/api/admin/service-locations/route.ts` — admin GET, POST
- `src/app/api/admin/service-locations/[id]/route.ts` — admin PATCH, DELETE
- `src/lib/__tests__/service-locations.test.ts` — 15 unit tests

**Changed**

- `prisma/schema.prisma` — added `ServiceLocation` model + 3 nullable pickup fields on `Booking`
- `prisma/seed.ts`, `prisma/seed.production.ts` — seed GTA cities
- `src/components/BookingForm.tsx` — country/city selectors with date-aware fetch
- `src/app/api/booking/route.ts` — accepts and validates structured pickup
- `src/app/api/booking/[id]/route.ts` — returns structured pickup fields
- `src/app/admin/page.tsx` — new Service Locations management card + booking details show structured fields
- `src/app/api/admin/bookings/route.ts` — includes structured fields in the list response
- `src/app/booking/[id]/page.tsx` — displays structured pickup
- `src/lib/email.ts` — uses `formatPickupLocation()` + escapes HTML so customer-supplied text can't break templates
- `src/lib/ics.ts` — uses `formatPickupLocation()` for `LOCATION` field
- `src/lib/__tests__/ics.test.ts` — fixture updated, 2 new tests

## Database migration

The Prisma schema is updated, but Neon needs the matching SQL. **Run this in Neon SQL Editor on the `production` branch** (and `development` branch if you have one).

```sql
-- 1. New ServiceLocation table.
CREATE TABLE "ServiceLocation" (
  "id"             TEXT NOT NULL PRIMARY KEY,
  "country"        TEXT NOT NULL,
  "city"           TEXT NOT NULL,
  "isActive"       BOOLEAN NOT NULL DEFAULT true,
  "availableFrom"  TIMESTAMP(3),
  "availableUntil" TIMESTAMP(3),
  "isDefault"      BOOLEAN NOT NULL DEFAULT false,
  "note"           TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "ServiceLocation_country_city_key"
  ON "ServiceLocation" ("country", "city");

CREATE INDEX "ServiceLocation_isActive_country_idx"
  ON "ServiceLocation" ("isActive", "country");

-- 2. Add structured pickup columns to Booking (nullable for back-compat).
ALTER TABLE "Booking" ADD COLUMN "pickupCountry" TEXT;
ALTER TABLE "Booking" ADD COLUMN "pickupCity"    TEXT;
ALTER TABLE "Booking" ADD COLUMN "pickupAddress" TEXT;

-- 3. Seed the permanent GTA service area (active).
INSERT INTO "ServiceLocation"
  ("id", "country", "city", "isActive", "isDefault", "updatedAt")
VALUES
  ('seed_loc_toronto',       'Canada', 'Toronto',       true, true,  NOW()),
  ('seed_loc_mississauga',   'Canada', 'Mississauga',   true, false, NOW()),
  ('seed_loc_vaughan',       'Canada', 'Vaughan',       true, false, NOW()),
  ('seed_loc_markham',       'Canada', 'Markham',       true, false, NOW()),
  ('seed_loc_richmond_hill', 'Canada', 'Richmond Hill', true, false, NOW())
ON CONFLICT ("country", "city") DO NOTHING;

-- 4. Seed tour cities (INACTIVE). Admin enables + sets dates per tour.
INSERT INTO "ServiceLocation"
  ("id", "country", "city", "isActive", "isDefault", "note", "updatedAt")
VALUES
  ('seed_tour_ottawa',      'Canada', 'Ottawa',      false, false,
    'Tour city — enable + set date window when a tour is confirmed.', NOW()),
  ('seed_tour_quebec_city', 'Canada', 'Quebec City', false, false,
    'Tour city — enable + set date window when a tour is confirmed.', NOW()),
  ('seed_tour_montreal',    'Canada', 'Montreal',    false, false,
    'Tour city — enable + set date window when a tour is confirmed.', NOW()),
  ('seed_tour_ny',          'USA',    'New York',    false, false,
    'Tour city — enable + set date window when a tour is confirmed.', NOW()),
  ('seed_tour_nj',          'USA',    'New Jersey',  false, false,
    'Tour city — enable + set date window when a tour is confirmed.', NOW())
ON CONFLICT ("country", "city") DO NOTHING;
```

> **Note**: Earlier docs included a `sortOrder INTEGER` column. We dropped it
> — locations now sort alphabetically by country/city for simpler admin UX.
> If your production DB still has the column (because you ran an earlier
> draft of this migration), run this cleanup:
>
> ```sql
> ALTER TABLE "ServiceLocation" DROP COLUMN IF EXISTS "sortOrder";
> ```

After running, verify:

```sql
SELECT "country", "city", "isActive", "isDefault", "sortOrder"
FROM "ServiceLocation"
ORDER BY "sortOrder";
```

You should see 5 rows, Toronto marked default.

## Local test plan

1. `npm install` (no new deps but Prisma client regen needed).
2. `npx prisma generate` (already part of postinstall, but safe to run).
3. Run the SQL above against your local/dev DB. If you don't have a local DB, point your local `.env.local` `DATABASE_URL` at a Neon dev branch and run there.
4. `npm test` — should report **46 / 46 passed**.
5. `npm run lint` — clean.
6. `npm run build` — clean.
7. `npm run dev` and open `http://localhost:3000`:
   - Pick a slot, fill the form. Country defaults to **Canada**, city to **Toronto**.
   - Try changing country (only "Canada" available initially). Cities should be Toronto / Mississauga / Vaughan / Markham / Richmond Hill.
   - Type a street address, submit. Booking should succeed.
8. Log into `/admin/login` → Calendar tab.
   - **Service Locations** card visible.
   - Add a test location: country `Canada`, city `Ottawa`, availableFrom `2026-07-12`, availableUntil `2026-07-14`. Click Add.
   - On the front end, with a booking date inside the window → Ottawa appears as a choice. Outside the window → it doesn't.
   - Toggle Active off → city disappears immediately.
   - Delete it → cleanup.
9. **API tampering test** (recommended): try a direct POST to `/api/booking` with `pickupCity: "Hamilton"`. It should return 400 with `"Selected pickup city is not available for this date..."`.

## Edge cases / known behavior

- **Legacy bookings** (created before this migration) have `pickupCountry/City/Address = null` but their `pickup` field still has the old free-text. The UI / emails / ICS fall back to `pickup` automatically via `formatPickupLocation()`. No data migration needed.
- **Newly created bookings** populate ALL FOUR fields (structured + a combined string in `pickup`) so older downstream consumers (fraud detection text checks, anything still reading `booking.pickup`) keep working.
- **Tour cities** with a date window: the admin can leave them `isActive: true` forever and just rotate the dates as new tours come up. The public API hides them outside the window automatically.
- **Default city per country**: enforced atomically in a transaction. Marking a new row default clears the previous default for that country in the same write.
- **Race protection**: BookingForm re-checks the location list right before submit (catches stale tabs).

## Security considerations

- Public `/api/service-locations` is read-only and returns only minimal fields (id, country, city, isDefault). No internal notes or dates leak.
- Admin endpoints all behind `requireAdmin()` (existing HMAC-signed cookie session).
- All Zod schemas have length caps on country/city (100 chars), address (200), note (500), notes (2000) — no DB bloat / DoS via large strings.
- Booking API revalidates server-side using `db.serviceLocation.findUnique({ where: { country_city: ... } })`. No string concatenation, no SQL injection vector.
- Pickup display in emails now goes through `escapeHtml()` so a city name with `<script>` (impossible via admin form due to validation, but defense in depth) can't render as HTML.
- ICS `escapeText()` was already in place — structured pickup gets the same treatment.
- Unique constraint `(country, city)` prevents duplicate rows.
- Date validation: rejects payloads where `availableUntil < availableFrom`.

## Future hardening (not done, intentional scope cap)

- Customer-supplied `notes`, `fullName`, `phone` in email templates are still raw-interpolated. They were not escaped before this PR either — out of scope for this change but worth a follow-up.
- An "edit existing location" admin UI would be cleaner than the current "disable / delete / re-add" flow. Backend PATCH already supports it; just needs UI.
- A per-day calendar view of which tour cities are bookable when would help the admin plan.

## Rollback plan

If anything goes wrong in production:

1. **Code rollback**: Vercel → Deployments → previous deploy → Promote to Production. ~5 seconds.
2. **DB rollback**: the new columns are all nullable and the new table is additive. Leaving them in place after a code rollback is safe — the old code will simply ignore them. If you want a hard rollback:

```sql
DROP TABLE "ServiceLocation";
ALTER TABLE "Booking" DROP COLUMN "pickupCountry";
ALTER TABLE "Booking" DROP COLUMN "pickupCity";
ALTER TABLE "Booking" DROP COLUMN "pickupAddress";
```

Neon's 6-hour Point-in-Time Restore also covers you.
