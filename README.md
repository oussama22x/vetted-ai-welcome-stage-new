# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/5d409441-bc10-41ff-899f-022082b652ce

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/5d409441-bc10-41ff-899f-022082b652ce) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/5d409441-bc10-41ff-899f-022082b652ce) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Ops Console access

The admin Ops Console is now available at `/admin/ops`. Legacy links to `/ops` or `/admin/projects` automatically redirect to the new canonical route.

## Setting up a fresh Supabase project

If you fork this Lovable project into a new Supabase instance, you need to apply
the checked-in migrations and regenerate the generated client types. The repo
includes a helper script that wraps the required Supabase CLI commands:

```sh
# Install the Supabase CLI first if you have not already.
# https://supabase.com/docs/guides/cli/getting-started

# From the repository root
scripts/setup-supabase.sh
```

The script will:

1. Link the repo to your Supabase project (you will be prompted for the project
   ref unless `SUPABASE_PROJECT_REF` is set; set `SUPABASE_DB_PASSWORD` to skip
   the password prompt).
2. Apply every migration under `supabase/migrations/` to your remote database via
   `supabase db push`.
3. Regenerate the client types in `src/integrations/supabase/types.ts` so the
   front end is aware of the new schema.

After it completes, the new Supabase project will have the same schema, security
policies, and storage configuration as the original app but without any of the
data from the source environment.
