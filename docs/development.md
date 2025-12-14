# Development Guide

This guide covers the development setup, build process, and common development tasks.

## Prerequisites

- **Node.js:** v18 or higher
- **npm:** v9 or higher (or yarn)
- **Git:** For version control

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/NSFW-Booru-Desctop-Client-Unofficial-.git
cd NSFW-Booru-Desctop-Client-Unofficial-
```

### 2. Install Dependencies

```bash
npm install
```

This installs:

- Electron and Electron-related dependencies
- React and React-related dependencies
- TypeScript and build tools
- Database libraries (Drizzle ORM, better-sqlite3)
- UI libraries (Tailwind CSS, shadcn/ui components)

### 3. Verify Installation

```bash
npm run typecheck
npm run lint
```

## Development Scripts

### `npm run dev`

Starts the application in development mode with Hot Module Replacement (HMR).

**What it does:**

- Starts Vite dev server for the Renderer process
- Compiles Main process with watch mode
- Opens Electron window with DevTools enabled
- Enables HMR for React components

**Usage:**

```bash
npm run dev
```

### `npm run build`

Builds the application for production.

**What it does:**

- Compiles TypeScript for Main and Renderer
- Bundles React application
- Generates production-ready Electron app in `out/`

**Usage:**

```bash
npm run build
```

### `npm run preview`

Previews the production build locally.

**Usage:**

```bash
npm run build
npm run preview
```

### `npm run typecheck`

Runs TypeScript compiler in check mode (no emit).

**Usage:**

```bash
npm run typecheck
```

### `npm run lint`

Runs ESLint to check code quality.

**Usage:**

```bash
npm run lint
```

### Database Scripts

#### `npm run db:generate`

Generates a new database migration from schema changes.

**Usage:**

1. Modify `src/main/db/schema.ts`
2. Run: `npm run db:generate`
3. Review generated migration in `drizzle/`

#### `npm run db:migrate`

Runs pending database migrations.

**Usage:**

```bash
npm run db:migrate
```

**Note:** Migrations run automatically on app startup, but you can run them manually for testing.

#### `npm run db:studio`

Opens Drizzle Studio for database inspection.

**Usage:**

```bash
npm run db:studio
```

Opens web interface at `http://localhost:4983` (default port).

## Project Structure

```
.
├── src/
│   ├── main/                 # Electron Main Process
│   │   ├── db/              # Database layer
│   │   │   ├── schema.ts    # Drizzle schema definitions
│   │   │   ├── db-service.ts # Database service class
│   │   │   └── migrate.ts   # Migration runner
│   │   ├── lib/             # Utilities
│   │   │   └── logger.ts    # Logging utility
│   │   ├── services/        # Background services
│   │   │   ├── sync-service.ts    # API synchronization service
│   │   │   └── updater-service.ts # Auto-updater service
│   │   ├── bridge.ts        # IPC bridge interface
│   │   ├── ipc.ts           # IPC handlers
│   │   └── main.ts          # Main process entry point
│   │
│   └── renderer/            # Electron Renderer Process
│       ├── components/       # React components
│       │   └── ui/          # UI components (shadcn/ui)
│       ├── lib/             # Utilities
│       │   └── utils.ts     # Helper functions
│       ├── App.tsx          # Main React component
│       ├── main.tsx         # Renderer entry point
│       └── index.html       # HTML template
│
├── drizzle/                  # Database migrations
│   ├── meta/                # Migration metadata
│   └── *.sql                # SQL migration files
│
├── docs/                     # Documentation
│   ├── api.md
│   ├── architecture.md
│   ├── contributing.md
│   ├── database.md
│   └── development.md
│
├── scripts/                  # Build and utility scripts
│   ├── ai_reviewer.py       # AI code review script
│   └── system_prompt.md     # AI reviewer prompt
│
├── electron.vite.config.ts  # Electron-Vite configuration
├── drizzle.config.ts        # Drizzle ORM configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies and scripts
```

## Development Workflow

### 1. Making Changes

**Main Process Changes:**

- Edit files in `src/main/`
- Changes require app restart (no HMR for Main process)
- Check console for errors

**Renderer Changes:**

- Edit files in `src/renderer/`
- Changes hot-reload automatically
- Check browser DevTools for errors

### 2. Adding New Features

**Adding an IPC Method:**

1. Define in `src/main/bridge.ts`:

   ```typescript
   export interface IpcBridge {
     newMethod: () => Promise<ReturnType>;
   }
   ```

2. Implement in `src/main/bridge.ts`:

   ```typescript
   const ipcBridge: IpcBridge = {
     newMethod: () => ipcRenderer.invoke("channel:name"),
   };
   ```

3. Add handler in `src/main/ipc.ts`:

   ```typescript
   ipcMain.handle("channel:name", async () => {
     // Implementation
   });
   ```

4. Update types in `src/renderer.d.ts`:
   ```typescript
   export interface IpcApi {
     newMethod: () => Promise<ReturnType>;
   }
   ```

**Adding a Database Table:**

1. Add schema in `src/main/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review migration in `drizzle/`
4. Test: `npm run db:migrate`

**Adding a React Component:**

1. Create component in `src/renderer/components/`
2. Use TypeScript and proper typing
3. Use Tailwind CSS for styling
4. Follow component patterns from existing code

### 3. Testing Changes

**Before Committing:**

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Manual testing
npm run dev
```

## Build Configuration

### Electron-Vite

**File:** `electron.vite.config.ts`

Configures:

- Main process build
- Preload script build
- Renderer process build (Vite)

### TypeScript

**File:** `tsconfig.json`

- Strict mode enabled
- ES modules
- Path aliases configured

### Tailwind CSS

**File:** `tailwind.config.js`

- Content paths configured
- Custom theme extensions
- shadcn/ui integration

## Debugging

### Main Process Debugging

**Console Logs:**

- Use `logger` from `src/main/lib/logger.ts`
- Logs appear in terminal/console

**Debugger:**

- Use VS Code debugger with Electron configuration
- Set breakpoints in Main process code

### Renderer Process Debugging

**DevTools:**

- Automatically opened in development mode
- Use React DevTools extension
- Use browser DevTools for debugging

**Console:**

- Access via `window.api` in DevTools console
- Test IPC calls directly

### Database Debugging

**Drizzle Studio:**

```bash
npm run db:studio
```

**Logs:**

- Database operations logged via `logger`
- Check for SQL errors in console

## Common Issues

### Issue: TypeScript Errors

**Solution:**

```bash
npm run typecheck
# Fix errors shown
```

### Issue: Database Migration Errors

**Solution:**

1. Check migration files in `drizzle/`
2. Verify schema changes
3. Try manual migration: `npm run db:migrate`

### Issue: IPC Not Working

**Solution:**

1. Verify bridge is exposed: Check `src/main/bridge.ts`
2. Verify handler is registered: Check `src/main/ipc.ts`
3. Check types match: Verify `src/renderer.d.ts`

### Issue: Build Fails

**Solution:**

1. Clear build cache: Delete `out/` and `node_modules/.vite/`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check for TypeScript errors: `npm run typecheck`

## Performance Optimization

### Development

- Use React DevTools Profiler
- Monitor IPC call frequency
- Check database query performance

### Production

- Enable production builds
- Minimize bundle size
- Optimize database queries
- Use indexes where needed

## Code Quality

### TypeScript

- No `any` types
- No unsafe casts
- Proper error handling
- Type inference where possible

### React

- Functional components only
- Proper prop typing
- Hooks best practices
- No inline styles

### Database

- Use Drizzle ORM (no raw SQL)
- Type-safe queries
- Proper error handling
- Transaction support where needed

## Environment Variables

Currently, no environment variables are required. Future additions:

- `API_KEY` - External API key (if needed)
- `NODE_ENV` - Development/production mode
- `ELECTRON_RENDERER_URL` - Dev server URL (auto-set by electron-vite)

## Hot Module Replacement (HMR)

**Renderer Process:**

- ✅ Fully supported
- React components hot-reload
- CSS changes apply instantly

**Main Process:**

- ❌ Not supported
- Requires app restart
- Use `npm run dev` for auto-restart

## Production Build

### Building

```bash
npm run build
```

Output in `out/`:

- `out/main/` - Main process bundle
- `out/preload/` - Preload script
- `out/renderer/` - Renderer bundle

### Distribution

Use `electron-builder` (configured in `package.json`):

```bash
# Build for current platform
npm run build
npx electron-builder

# Build for specific platform
npx electron-builder --win
npx electron-builder --mac
npx electron-builder --linux
```

## Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Getting Help

1. Check existing documentation in `docs/`
2. Review similar code in the codebase
3. Check GitHub issues
4. Open a new issue with details

