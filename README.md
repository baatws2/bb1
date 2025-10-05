# Supermarket Expiry Tracker (Expo)

- Expo + expo-router app with Supabase backend
- Web build via `expo export --platform web`
- Deployed to GitHub Pages with Actions

## Local dev

```powershell
npm install
npm run web:expo
```

## Build web

```powershell
npx expo export --platform web --output-dir dist
```

## Deploy on GitHub Pages

- The workflow `.github/workflows/deploy.yml` builds Expo Web and deploys `dist/`.
- Configure repository secrets:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Push to `main` to trigger deploy.

After deploy, the site will be available at:

```
https://<your-username>.github.io/<repo-name>/
```