# Devbhoomi Electrics — website

Production code for the Devbhoomi Electrics electric scooter showroom website. It uses the same Firebase project (`devbhoomi-electrics`) as the Android app, so listings, carts, wishlists, order queries, chats, and partner applications are shared.

Built with Next.js 15, React 19, Tailwind CSS 4, and Firebase (Auth, Firestore, Storage). Deployed with Firebase App Hosting (`apphosting.yaml`).

## Run locally

```powershell
$env:NODE_OPTIONS="--use-system-ca"   # needed on networks that require the Windows certificate store
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy

Every push to `main` on GitHub triggers a new App Hosting rollout once the backend is connected in Firebase Console → App Hosting.

After the first rollout, add the App Hosting domain (and any custom domain) under Firebase Console → Authentication → Settings → Authorized domains so Google sign-in works.

## Structure

- `src/lib/` — data layer: Firebase setup, Firestore/Storage repository, app state, savings calculator, sample catalog
- `src/components/` — screens and UI components
- `src/app/` — Next.js entry, layout, global styles
