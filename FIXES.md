# CampusFlow EPR Fixed Package

This package is the corrected version of the uploaded EPR project.

Main changes:
- Sample-style CampusFlow login page.
- Role-specific Principal, Teacher and Parent portals.
- Parent portal is restricted to the linked child only.
- Unlinked parent accounts show the no-child state.
- Principal can link a child to a parent from Parents management.
- Role-based navigation and route protection.
- Functional notice creation/edit/delete for authorized roles.
- Principal student management restored.
- TypeScript and ESLint checks pass.

The original `.env.local`, `node_modules`, and `.next` build/cache directories are intentionally not included. Keep your existing `.env.local` values or copy `.env.example` to create it.
