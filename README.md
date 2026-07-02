# OCP Stock

Digital platform for tracking phosphate stock flows at the Casablanca port — from the Khouribga train arrivals to vessel loading. The project includes a public showcase site, a user space and an administrator space, all backed by a lightweight CSV "database" served through a small Node.js API.

## Features

- **Showcase site** (`/`) — hero slideshow, stock pipeline, Casablanca port history, scroll-stack gallery, strategic partners marquee, Morocco network map, contact form.
- **Authentication** — sign in / sign up modal connected to the CSV API (email or matricule + password, SHA-256 salted hashes).
- **User space** (`/utilisateur/:matricule`) — vertical sidebar with **Paramètres** (edit profile, photo, password) and **Module 1 / Module 2** (under construction).
- **Admin space** (`/admin`) — dashboard with user list, role management, block/unblock access, admin settings.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite 6](https://vite.dev/)
- [Tailwind CSS 3](https://tailwindcss.com/), [Framer Motion](https://motion.dev/), [Lenis](https://lenis.darkroom.engineering/), [Lucide](https://lucide.dev/)
- Node.js HTTP API (no framework) reading/writing `database/utilisateur.csv`

## Prerequisites

- [Node.js](https://nodejs.org/) **18 or newer** (20+ recommended)
- npm (bundled with Node.js)

## Getting started

```bash
# 1. Clone the repository
git clone https://github.com/Yassineachkhity/ocp-stock.git

# 2. Enter the project folder
cd ocp-stock

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Then open **http://localhost:5173** in your browser.

> `npm run dev` starts the Vite dev server **and** automatically launches the CSV API on port **3001** (see the `csvApiServer` plugin in `vite.config.ts`). All `/api/*` calls are proxied to it, so one command is enough.

## Demo account

| Role | Identifier | Password |
|------|------------|----------|
| Administrateur | `admin@ocp.ma` (or `ADM-0001`) | `admin` |

New accounts can be created from the **Inscription** tab of the login modal; they are appended to `database/utilisateur.csv`.

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite (port 5173) + CSV API (port 3001) |
| `npm run api` | Start only the CSV API (`server/index.js`) |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Preview the production build locally |

## Project structure

```
ocp_stock/
├── database/
│   └── utilisateur.csv        # User "database" (demo rows included)
├── server/
│   ├── index.js               # HTTP API (auth, users CRUD)
│   └── userRepository.js      # CSV read/write + password hashing
├── src/
│   ├── App.tsx                # Showcase site + auth modal
│   ├── UserPage.tsx           # User space (/utilisateur/:matricule)
│   ├── AdminPage.tsx          # Admin space (/admin)
│   ├── api.ts                 # Frontend API client
│   └── components/            # ScrollStack, Aurora, app shell, dashboard...
├── public/                    # Images and logos
└── vite.config.ts             # Vite config + /api proxy + API auto-start
```

## API overview

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/auth/login` | Sign in with `{ identifier, password }` |
| `GET` | `/api/users` | List users |
| `POST` | `/api/users` | Create a user |
| `GET` | `/api/users/:matricule` | Get one user |
| `PATCH` | `/api/users/:matricule` | Update profile fields |
| `PATCH` | `/api/users/:matricule/password` | Change password |
| `DELETE` | `/api/users/:matricule` | Delete a user |
