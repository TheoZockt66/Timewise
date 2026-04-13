# Vercel Deployment

## Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Recommended Vercel Settings

- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `.next`

## Notes

- The app expects the public Supabase variables to exist in every environment.
- If local dependencies are stale, run `npm install` before building.
- The UI font is loaded at runtime, so the build no longer depends on a Google Fonts fetch.
