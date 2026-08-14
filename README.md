# TechLadder Corporation

Full-stack advertisement portfolio website.

**Stack:** Angular 20 (frontend) → Node.js/Express (backend) → MySQL (database)
Auth: JWT + bcrypt · Uploads: Multer · File storage: local disk (`backend/uploads`)

```
techladder-corporation/
  frontend/     Angular app (public site + admin panel)
  backend/      Node.js/Express API
  database/     schema.sql, seed.sql
```

---

## 1. Prerequisites

- Node.js 18+
- MySQL 8.x
- Angular CLI 20 (`npm install -g @angular/cli`) — optional, `npx ng` also works

---

## 2. Database setup

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

This creates the `techladder_corporation` database with `admins`, `categories`,
`videos`, and `contact_enquiries` tables, and seeds a starter set of categories.

**The admin account is NOT created by SQL.** Passwords are never stored in
plaintext or committed to a SQL file — see step 3.

---

## 3. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=techladder_corporation
JWT_SECRET=generate_a_long_random_string_here
ADMIN_EMAIL=mediaagencytlc@gmail.com
ADMIN_PASSWORD=Techl@dder123
CORS_ORIGIN=http://localhost:4200
PUBLIC_BASE_URL=http://localhost:3000
```

Create the initial admin account (hashes the password with bcrypt and inserts it —
the plaintext password from `.env` is never written to the database):

```bash
npm run seed:admin
```

Start the backend:

```bash
npm run dev      # nodemon, for local development
# or
npm start        # plain node, for production
```

The API runs on `http://localhost:3000` by default. Health check: `GET /api/health`.

**Change `ADMIN_PASSWORD` and re-run `npm run seed:admin` before going to
production** — the value in `.env.example` is a development placeholder only.

---

## 4. Frontend setup

```bash
cd frontend
npm install
```

`src/environments/environment.ts` (development) already points at
`http://localhost:3000/api`. Start the dev server:

```bash
npm start
```

Visit `http://localhost:4200`. Admin panel: `http://localhost:4200/admin/login`.

---

## 5. Production build

### Frontend

Before building, edit `src/environments/environment.prod.ts` and set
`apiBaseUrl` / `mediaBaseUrl` to your **real deployed backend URL** — never
leave these pointing at `localhost`.

```bash
cd frontend
npm run build:prod
```

Output is written to `frontend/dist/techladder-frontend/browser`. Deploy this
as a static site (Nginx, Apache, Netlify, Vercel static hosting, S3+CloudFront, etc).

### Backend

```bash
cd backend
npm install --omit=dev
```

Run with a process manager in production, e.g. PM2:

```bash
npm install -g pm2
pm2 start src/server.js --name techladder-api
```

Set production `.env` values:
- `NODE_ENV=production`
- `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` → your production MySQL instance
- `JWT_SECRET` → a fresh, long, random value (different from development)
- `CORS_ORIGIN` → your deployed frontend's exact origin, e.g. `https://techladdercorporation.com`
- `PUBLIC_BASE_URL` → your deployed backend's public URL

### MySQL

Run `schema.sql` and `seed.sql` against your production database, then run
`npm run seed:admin` once against production `.env` to create the real admin
account with a strong, unique password.

### Upload directories

`backend/uploads/videos` and `backend/uploads/thumbnails` must exist and be
writable by the Node process. They're created automatically on first run, but
for production deployments (e.g. behind a load balancer or in a container),
mount them as **persistent storage** — a redeploy without a persistent volume
will delete uploaded media. The code is written so `video_filename` /
`thumbnail_filename` are stored separately from the URL, making a later move
to S3/Cloudflare R2/a CDN a backend-only change with no frontend impact.

### CORS

The backend only accepts requests from the origin(s) listed in `CORS_ORIGIN`
(comma-separated for multiple). Update this whenever the frontend's deployed
URL changes.

### Reverse proxy (recommended)

Put both frontend and backend behind Nginx (or similar) so the public site is
served over HTTPS and `/api` + `/uploads` are proxied to the Node backend on
the same domain — this avoids CORS entirely in production. Example Nginx
snippet:

```nginx
server {
  listen 443 ssl;
  server_name techladdercorporation.com;

  location / {
    root /var/www/techladder-frontend/browser;
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://localhost:3000;
  }

  location /uploads/ {
    proxy_pass http://localhost:3000;
  }
}
```

If you proxy this way, set `apiBaseUrl: '/api'` and `mediaBaseUrl: ''` in
`environment.prod.ts` instead of a separate API domain.

---

## 6. API reference

### Auth
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Returns `{ token, admin }` |
| GET | `/api/auth/me` | JWT | Current admin info |

### Public
| Method | Route | Description |
|---|---|---|
| GET | `/api/public/videos` | Published videos. Query: `page`, `limit`, `category` (slug), `search`, `featured` |
| GET | `/api/public/videos/:id` | Single published video + related videos |
| GET | `/api/public/categories` | All categories |
| POST | `/api/public/contact` | Submit contact enquiry |

### Admin (all require `Authorization: Bearer <token>`)
| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/videos` | All videos + dashboard stats. Query: `status`, `category`, `search` |
| GET | `/api/admin/videos/:id` | Single video (any status) |
| POST | `/api/admin/videos` | Create video. `multipart/form-data`: `video`, `thumbnail`, `title`, `clientName`, `description`, `categoryId`, `campaignType`, `status`, `featured` |
| PUT | `/api/admin/videos/:id` | Update video (files optional) |
| DELETE | `/api/admin/videos/:id` | Delete video + its files |
| PATCH | `/api/admin/videos/:id/status` | Body: `{ status: 'draft' \| 'published' }` |
| PATCH | `/api/admin/videos/:id/featured` | Body: `{ featured: boolean }` |
| POST | `/api/admin/categories` | Create category |
| PUT | `/api/admin/categories/:id` | Rename category |
| DELETE | `/api/admin/categories/:id` | Delete category |

All admin routes are protected **on the backend** via `requireAuth` middleware
— the Angular `authGuard` is a UX convenience only and is never the actual
security boundary.

---

## 7. Security notes

- Passwords are hashed with bcrypt (cost factor 12); plaintext is never stored or logged.
- JWT secret must be a long random string, unique per environment.
- File uploads are validated by MIME type, extension, and size on the backend (never trust the client alone).
- All SQL queries use parameterized statements (`mysql2` placeholders) — no string concatenation.
- CORS is restricted to explicitly configured origins.
- `.env` is git-ignored; only `.env.example` (with placeholder values) is committed.
