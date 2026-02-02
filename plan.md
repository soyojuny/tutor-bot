# Plan for Family-based Data Segregation

This document outlines the plan to refactor the Tutor Bot application to support multi-tenancy using `families`. The goal is to ensure all data is strictly segregated by `family_id`.

## 1. Database Schema Changes

The following tables need to be altered to include a `family_id` column. This column will be a non-nullable foreign key referencing `families(id)`.

-   [ ] `activities`
-   [ ] `activity_completions`
-   [ ] `rewards`
-   [ ] `points_ledger`
-   [ ] `reward_redemptions`
-   [ ] `daily_streaks`
-   [ ] `book_discussions`

A new migration script will be created for these changes.

## 2. Row Level Security (RLS) Policies

To ensure data segregation at the database level, we will replace the existing "Deny All" policies with new policies based on `family_id`. This provides a critical security layer in addition to the API-level checks.

First, a helper function will be created in the new migration script to get the current user's `family_id` from their profile:

```sql
-- Helper function to get the family_id of the currently authenticated user
create or replace function public.get_current_family_id()
returns uuid
language sql
stable
as $$
  select family_id from public.profiles where id = auth.uid() limit 1;
$$;
```

Then, for each table with a `family_id` (e.g., `activities`, `rewards`, `book_discussions`, etc.), the migration will remove the old "Deny" policy and add a new comprehensive policy.

**Example Policy for `activities` table:**

```sql
-- 1. Remove the old "Deny" policy
DROP POLICY IF EXISTS "Deny direct activities access" ON public.activities;

-- 2. Create a new policy for family-based access
CREATE POLICY "Enable access for family members"
  ON public.activities FOR ALL
  USING (family_id = public.get_current_family_id())
  WITH CHECK (family_id = public.get_current_family_id());
```
This policy ensures that users can only `SELECT`, `UPDATE`, or `DELETE` records that belong to their family, and can only `INSERT` new records associated with their own family. This pattern will be applied to all family-specific tables.

## 3. API Layer (Backend)

All API routes must be updated to enforce family-based data access. The `family_id` will be retrieved from the authenticated user's profile.

### 3.1. Authentication (`lib/auth/session.ts`)

-   Modify `getSession` to also retrieve `family_id` from the profile and include it in the session object.

### 3.2. API Helpers (`lib/api/helpers.ts`)

-   Update API helper functions to accept `family_id` and include it in Supabase queries.

### 3.3. API Routes

Each of the following API routes must be modified to:
1.  Extract `family_id` from the session.
2.  Use `family_id` in all Supabase queries (`select`, `insert`, `update`, `delete`, `rpc`) to ensure data is scoped to the family.

-   **Activities:**
    -   `app/api/activities/route.ts` (GET, POST)
    -   `app/api/activities/[id]/route.ts` (PUT, DELETE)
    -   `app/api/activities/[id]/complete/route.ts` (POST)
    -   `app/api/activities/log-completion/route.ts` (POST)
-   **Activity Logs:**
    -   `app/api/activity-logs/[log_id]/verify/route.ts` (POST)
-   **Book Discussions:**
    -   `app/api/book-discussions/route.ts` (GET, POST)
-   **Points:**
    -   `app/api/points/route.ts` (GET)
-   **Rewards:**
    -   `app/api/rewards/route.ts` (GET, POST)
    -   `app/api/rewards/[id]/route.ts` (PUT, DELETE)
    -   `app/api/rewards/redemptions/route.ts` (GET, POST)
    -   `app/api/rewards/redemptions/[id]/route.ts` (PUT)
-   **Streaks:**
    -   `app/api/streaks/[profileId]/route.ts` (GET)
-   **Profiles:**
    -   `app/api/profiles/route.ts` (GET, POST): Ensure that new profiles are created with the correct `family_id`. When fetching profiles, only return profiles from the same family.

## 4. Data Access Layer (`lib/services`, `lib/supabase`)

-   Update service functions to require `family_id`.
-   `lib/services/points.ts`
-   `lib/services/streaks.ts`

## 5. Type Definitions (`types/*.ts`)

Update the following type definitions to include `family_id`.

-   `types/activity.types.ts`
-   `types/book-discussion.types.ts`
-   `types/points.types.ts`
-   `types/reward.types.ts`
-   `types/streak.types.ts`

## 6. Frontend

While most of the changes are in the backend, some frontend components might need adjustments if they directly interact with data that is now family-scoped. The primary change will be ensuring that the user's `family_id` is available in the session and passed to API calls implicitly through the session.

-   `hooks/useAuth.ts`: Ensure the auth hook provides profile information that includes `family_id`.
-   Review all pages and components that fetch or manipulate data to ensure they rely on the backend to handle family scoping.