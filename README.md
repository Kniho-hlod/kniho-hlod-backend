# kniho-hlod-backend

REST API backend for the **kniho-hlod** book lending application.

## Tech Stack

funguj

- **Runtime:** Node.js 22 + TypeScript
- **Framework:** Express (via `@eleansphere/be-core`)
- **ORM:** Sequelize 6 + PostgreSQL (`pg`)
- **Auth:** JWT (`createExtractUser` middleware on protected routes)
- **Password hashing:** bcrypt
- **File uploads:** multer (avatar images stored as BLOB)
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Render (triggered by GitHub Actions)

## Architecture

The app is built on the internal `@eleansphere/be-core` framework, which handles Express setup, database connection, CRUD routing, file uploads, JWT authentication, and centralized error handling. All domain models and DTO types come from `@eleansphere/kniho-hlod-service`.

```
src/
├── index.ts                   App entry point — wires createApp() with models and plugin
├── logger.ts                  Minimal structured logger
├── plugin.ts                  Thin orchestrator — registers all route modules
├── middleware/
│   └── request-logger.ts      Per-prefix request/response logger factory
├── routes/
│   ├── auth.ts                POST /api/auth/change-password
│   ├── users.ts               CRUD /api/users with bcrypt hooks
│   ├── system-notifications.ts GET /api/system-notifications/active + admin CRUD
│   └── profile-images.ts      File upload/download /api/profile-images
└── types/
    └── express.d.ts           Module augmentation: adds req.user to Express.Request
```

### Model registration

All four models (Book, Loan, ProfileImage, User) are defined in `@eleansphere/kniho-hlod-service` and registered via `modelConfigs` in `index.ts`. Book and Loan use auto-generated CRUD routes. User and ProfileImage use `skipAutoRoutes: true` — their routes are registered manually in `plugin.ts` to support custom bcrypt hooks and file upload handling.

### Extending routes

To add a new route group: create `src/routes/<resource>.ts` exporting a `register<Resource>Routes(app, model, extractUser)` function, then call it from `plugin.ts`.

### Authentication

- `/api/books`, `/api/loans` — protected automatically via `userScoped: true` in entity config (be-core applies `createExtractUser`)
- `/api/users`, `/api/profile-images` — protected manually via `createExtractUser` in `plugin.ts`
- `/api/auth/login` — public
- `/api/auth/me` — protected

## API Endpoints

| Route | Auth | Notes |
|-------|------|-------|
| `POST /api/auth/login` | Public | Returns JWT |
| `GET /api/auth/me` | JWT | Returns current user |
| `GET/POST/PUT/DELETE /api/users` | JWT | bcrypt on create/update |
| `POST/GET /api/profile-images` | JWT | File upload (avatar BLOB) |
| `GET/POST/PUT/DELETE /api/books` | JWT + userScoped | Filtered by ownerId |
| `GET/POST/PUT/DELETE /api/loans` | JWT + userScoped | Filtered by ownerId |

### Error Response Format

Error handling is provided by `be-core`'s built-in `defaultErrorHandler`, registered automatically after all routes. All errors return JSON:

```json
{ "error": "Not Found", "message": "User not found", "statusCode": 404 }
```

| Field | Description |
|-------|-------------|
| `error` | Short error name (e.g., `"Internal Server Error"`, `"Not Found"`) |
| `message` | Human-readable detail. For 5xx: always `"An unexpected error occurred"` |
| `statusCode` | HTTP status code repeated in the body |

## Local Development

### Prerequisites

- Node.js 22+
- Access to the `@eleansphere` and `@kniho-hlod` GitHub Package Registries (requires a GitHub PAT with `read:packages`)
- Copy `.env.example` to `.env` and fill in values

### Commands

```bash
npm run dev      # nodemon watch mode
npm run build    # tsc compile to dist/
npm run start    # node dist/index.js
npm run format   # prettier --write src/
```

## Environment Variables

Create a `.env` file (see `.env.example`):

| Variable          | Required   | Description                              |
| ----------------- | ---------- | ---------------------------------------- |
| `DATABASE_URL`    | Yes        | PostgreSQL connection string             |
| `JWT_SECRET`      | Yes        | Secret for signing JWT tokens (use a strong 32+ char random value) |
| `PORT`            | No         | Server port (default: 3000)              |
| `NODE_AUTH_TOKEN` | Build only | GitHub PAT with `read:packages`          |

## Deployment

Pushes to `master` trigger the GitHub Actions workflow (`.github/workflows/deploy.yml`), which:

1. Checks out code
2. Installs dependencies from GitHub Package Registry
3. Compiles TypeScript
4. Triggers a Render deploy webhook

Required GitHub repository secrets:

- `NODE_AUTH_TOKEN` — GitHub PAT with `read:packages`
- `RENDER_DEPLOY_HOOK_URL` — Render deploy hook URL
