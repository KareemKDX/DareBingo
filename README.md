# 🎯 Bingospel

En bingo-/utmaningsapp. Spelare klarar utmaningskort, får poäng och tävlar på en live-highscore.

**Stack:** React + Vite (JavaScript) · Supabase (auth, databas, realtime) · Vercel.
Ingen egen backend – säkerheten sköts med Row Level Security i Supabase.

```
BINGOSPEL/
├── supabase/schema.sql   ← kör i Supabase SQL Editor
└── frontend/             ← React-appen (deployas till Vercel)
```

---

## 1. Supabase

1. Skapa ett projekt på [supabase.com](https://supabase.com).
2. **SQL Editor** → klistra in hela `supabase/schema.sql` → **Run**.
3. **Authentication → Sign In / Providers → Email**: stäng av **Confirm email**
   (så att folk kan börja spela direkt utan att bekräfta via mejl).
4. **Project Settings → API**: kopiera **Project URL** och **anon public key**.

## 2. Kör lokalt

```bash
cd frontend
cp .env.example .env      # Windows: copy .env.example .env
# fyll i VITE_SUPABASE_URL och VITE_SUPABASE_ANON_KEY i .env
npm install
npm run dev
```

Öppna http://localhost:5173. Testa på mobilen: `npm run dev -- --host` och öppna adressen som visas (samma wifi).

## 3. Gör dig själv till admin

Registrera ett konto i appen, sen i SQL Editor:

```sql
update profiles set is_admin = true where username = 'DITT_ANVÄNDARNAMN';
```

Ladda om appen – länken **Admin** dyker upp.

## 4. Deploya till Vercel

1. Lägg koden på GitHub.
2. På [vercel.com](https://vercel.com): **Add New → Project** → välj repot.
3. **Root Directory:** `frontend` (viktigt!). Framework: Vite (hittas automatiskt).
4. **Environment Variables:** lägg till `VITE_SUPABASE_URL` och `VITE_SUPABASE_ANON_KEY`.
5. **Deploy.**
6. I Supabase → **Authentication → URL Configuration**: sätt **Site URL** till din Vercel-adress.

`vercel.json` gör att alla adresser (t.ex. `/game/123`) går till `index.html`, så att React Router funkar vid refresh.

> Ändrar du env-variabler i Vercel måste du deploya om (Deployments → Redeploy).

---

## Hur det funkar

| Funktion | Var |
|---|---|
| Inloggning / profil | `src/AuthContext.jsx` |
| Skyddade sidor | `src/components/ProtectedRoute.jsx`, `AdminRoute.jsx` |
| Spellista | `src/pages/GamesPage.jsx` |
| Kort, highscore, realtime, vinnare | `src/pages/GamePage.jsx` |
| Admin | `src/pages/AdminPage.jsx`, `AdminGamePage.jsx` |

- **Highscore** kommer från vyn `leaderboard` i databasen. Sorteras på poäng, och vid lika
  poäng vinner den vars senaste klara kort kom tidigast (= nådde poängen först).
  Tiden sätts alltid av servern, så den går inte att fuska med.
- **Realtime:** spelsidan lyssnar på ändringar i `completions` och `games` och laddar om.
- **Säkerhet (RLS):** inloggade får läsa allt. Spelare får bara skapa/ta bort sina egna
  completions och bara när spelet är aktivt. Bara admins får ändra spel och kort.
  Ingen kan göra sig själv till admin via appen.

## Felsökning

- **"Missing VITE_SUPABASE_URL"** i konsolen → `.env` saknas eller dev-servern behöver startas om.
- **Highscore uppdateras inte live** → kolla Database → Publications → `supabase_realtime`
  att `completions` och `games` är påslagna.
- **"Database error saving new user"** vid registrering → användarnamnet är troligen upptaget.
- **404 vid refresh på Vercel** → kontrollera att Root Directory är `frontend` (så att `vercel.json` hittas).
