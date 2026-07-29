# Setup & Development

Operational guide for running Payly locally. For what the project is and how
it's put together, see [README.md](./README.md).

## Requirements

- Node `^20.19.0 || >=22.12.0`
- npm
- A [Supabase](https://supabase.com) project (free tier is enough) — Payly
  talks to Supabase for auth, database, and storage; there's no local mock.

## 1. Install dependencies

```sh
npm install
```

## 2. Configure environment variables

Create a `.env` file in the project root:

```sh
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-project-anon-key>
SUPABASE_DB_PASSWORD=<your-project-db-password>   # only needed for `supabase db push` / `gen:types`
```

Find `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Project
Settings → API** in the Supabase dashboard.

## 3. Set up the database schema

The schema, RLS policies, and RPC functions live in
[`supabase/migrations/`](./supabase/migrations) and are the source of truth
— apply them to your Supabase project rather than clicking things together
in the dashboard:

```sh
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

This creates the tables (`groups`, `group_members`, `expenses`,
`expense_splits`, `settlements`, …), enables Row Level Security, and
installs the RPC functions (`create_expense_with_splits`,
`update_expense_with_splits`, `settle_expense_splits`,
`get_group_activities`, `get_group_member_balances`,
`get_user_financial_summary`).

You'll also need Google OAuth configured under **Authentication →
Providers** in the Supabase dashboard for sign-in to work.

## Development

Start the dev server with hot-reload:

```sh
npm run dev
```

## Build

Type-check, compile, and minify for production:

```sh
npm run build
```

Preview the production build locally:

```sh
npm run preview
```

## Testing

Run the full unit-test suite once:

```sh
npm test
```

Watch mode (re-runs affected tests on change):

```sh
npm run test:watch
```

Run a single test file — pass the path after `--`:

```sh
npm test -- src/shared/utils/currency.util.test.ts
```

You can also filter by a filename substring:

```sh
npm test -- currency
```

## Lint & Format

```sh
npm run lint           # oxlint + eslint, with --fix
npm run format         # format src/ with Prettier (writes changes)
npm run format:check   # verify formatting without writing (used in CI)
```

The generated `src/shared/lib/database.types.ts` is excluded from Prettier via
`.prettierignore`.

## Database types

After changing the schema (adding a migration under `supabase/migrations/`
and pushing it), regenerate the typed client bindings:

```sh
npm run gen:types
```

This writes `src/shared/lib/database.types.ts`, which is the only place
table/RPC shapes are declared — the rest of the app imports types from here
rather than redefining them.

## Adding a database change

Payly treats migrations as code, not dashboard clicks:

1. Add a new file under `supabase/migrations/`, named
   `YYYYMMDDHHMMSS_description.sql`.
2. Write the change as a focused diff (`CREATE FUNCTION`, `ALTER TABLE`,
   etc.) — see existing files in that folder for the convention.
3. `npx supabase db push` to apply it.
4. `npm run gen:types` to sync the TypeScript types.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).
