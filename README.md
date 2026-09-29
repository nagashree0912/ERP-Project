# CampusFlow EPR — Fixed ERP Portal

Next.js 14 + TypeScript + Tailwind CSS + Supabase Auth college ERP.

## What was fixed

- Login page redesigned to match the supplied CampusFlow sample: Principal / Teacher / Parent role tabs, campus visual, gradient sign-in card, remember-me and forgot-password actions.
- Principal dashboard redesigned around the supplied sample layout: KPI cards, recent requests, attendance overview, upcoming exams and management quick actions.
- Teacher dashboard redesigned around the supplied sample layout: classes, students, pending tasks, notices, today's classes, attendance and quick actions.
- Parent dashboard redesigned around the supplied sample layout: linked-child card, attendance, average score, exams, fees, marks and notices.
- Parent accounts can see **only the child linked to that parent record**.
- A parent with no linked child receives a clear **No children linked** message instead of seeing another student's data.
- Principal Parents management now includes a **Link child** selector.
- Navigation is role-specific and unauthorized routes are redirected to the dashboard.
- Principal and Teacher notice management is functional; parents receive a read-only filtered notice view.
- Student management remains available to the Principal, while parents receive a child-only view.
- Existing CRUD, local demo-store persistence, notifications, theme switch, search, exports and page actions were preserved.
- TypeScript and ESLint checks pass in the supplied project environment.

## Run locally

1. Keep your existing `.env.local` with:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. If `node_modules` is not present, run:
   `npm install`
3. Start the app:
   `npm run dev`
4. Open:
   `http://localhost:3000`

## Authentication

Authentication uses Supabase Auth. The selected Principal / Teacher / Parent role is checked against Supabase user metadata when a role is present. Passwords are not stored in the local ERP data store.

## Parent-child linking

The local ERP store uses the parent email to find the parent record and then resolves the linked student through `student_id` (with compatibility fallbacks for existing field names). The Principal can create/edit a parent and select a child from the **Link child** field.

If no child is linked, the Parent portal shows only the no-child state.

## Verification

The corrected source was checked with:

- `tsc --noEmit`
- ESLint on `src`

A production Next.js build could not be completed in this isolated environment because the supplied archive contains the Windows SWC binary while the verification environment is Linux and cannot download the Linux SWC package from npm. This does not change the source corrections.
