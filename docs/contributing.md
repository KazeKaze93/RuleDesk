# Contributing Guide

Thank you for your interest in contributing to NSFW Booru Desktop Client! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and professional
- Follow the project's coding standards
- Write clear, maintainable code
- Test your changes before submitting

## Development Principles

This project adheres to strict development principles. Please review these before contributing:

### KISS & YAGNI

- **KISS (Keep It Simple, Stupid):** Prefer simple, readable solutions
- **YAGNI (You Aren't Gonna Need It):** Implement only what's required now

### SOLID & DRY

- **Single Responsibility:** One component/function = one job
- **DRY (Don't Repeat Yourself):** Refactor duplicated code
- **Composition over Inheritance:** Prefer composition in React

### Code Quality

- **TypeScript:** Strict typing, no `any` or unsafe casts
- **Explicit over Implicit:** No magic numbers or strings
- **Fail Fast:** Validate inputs at boundaries
- **Error Handling:** Proper error handling, no bare `catch (e)`

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm or yarn
- Git

### Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/<your-username>/NSFW-Booru-Desctop-Client-Unofficial-.git
   cd NSFW-Booru-Desctop-Client-Unofficial-
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Run Development Mode**

   ```bash
   npm run dev
   ```

4. **Run Type Checking**

   ```bash
   npm run typecheck
   ```

5. **Run Linter**
   ```bash
   npm run lint
   ```

## Development Workflow

### Branch Strategy

- Create a feature branch from `master`
- Use descriptive branch names: `feature/add-download-manager`, `fix/artist-validation`

### Making Changes

1. **Create a Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**

   - Follow the coding standards
   - Write clear, self-documenting code
   - Add comments where necessary

3. **Test Your Changes**

   - Run the application: `npm run dev`
   - Check for TypeScript errors: `npm run typecheck`
   - Run the linter: `npm run lint`

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add download manager"
   ```

### Commit Message Format

Follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

**Example:**

```
feat: add artist deletion functionality

- Add deleteArtist method to DbService
- Add delete button to artist list UI
- Add confirmation dialog before deletion
```

## Code Standards

### TypeScript

- **No `any` types:** Use proper types or `unknown`
- **No unsafe casts:** Avoid `as` unless absolutely necessary
- **Strict mode:** All code must pass `tsc --noEmit`
- **Type inference:** Prefer inference where possible

**Good:**

```typescript
const artists: Artist[] = await dbService.getTrackedArtists();
```

**Bad:**

```typescript
const artists: any = await dbService.getTrackedArtists();
```

### React

- **Functional Components:** Use function components, not classes
- **Hooks:** Prefer hooks over lifecycle methods
- **Props Types:** Always type component props
- **No Inline Styles:** Use Tailwind CSS classes

**Good:**

```typescript
interface ArtistCardProps {
  artist: Artist;
  onDelete: (id: number) => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onDelete }) => {
  return <div className="p-4">{artist.name}</div>;
};
```

**Bad:**

```typescript
export const ArtistCard = ({ artist, onDelete }: any) => {
  return <div style={{ padding: "16px" }}>{artist.name}</div>;
};
```

### Error Handling

- **Never use bare catch:** Always handle errors properly
- **Descriptive errors:** Provide meaningful error messages
- **Log errors:** Use the logger for error tracking

**Good:**

```typescript
try {
  const result = await dbService.addArtist(data);
  return result;
} catch (error) {
  logger.error("Failed to add artist:", error);
  if (error instanceof Error) {
    throw new Error(`Failed to add artist: ${error.message}`);
  }
  throw error;
}
```

**Bad:**

```typescript
try {
  return await dbService.addArtist(data);
} catch (e) {
  // ...
}
```

### Database

- **Use Drizzle ORM:** Never write raw SQL unless necessary
- **Type Safety:** Use inferred types from schema
- **Migrations:** Always create migrations for schema changes

**Good:**

```typescript
const artists = await db.query.artists.findMany({
  where: eq(schema.artists.id, artistId),
});
```

**Bad:**

```typescript
const artists = db.prepare("SELECT * FROM artists WHERE id = ?").all(artistId);
```

## Database Changes

### Creating Migrations

1. **Modify Schema** (`src/main/db/schema.ts`)

2. **Generate Migration**

   ```bash
   npm run db:generate
   ```

3. **Review Migration** (in `drizzle/` folder)

4. **Test Migration**
   ```bash
   npm run db:migrate
   ```

## Testing

### Manual Testing

- Test all new features manually
- Verify error handling
- Check UI responsiveness
- Test on different screen sizes

### Automated Testing

(To be implemented)

## Pull Request Process

1. **Update Documentation**

   - Update relevant documentation files
   - Add examples if introducing new features

2. **Update README**

   - If adding new features, update the README
   - Keep the README concise

3. **Create Pull Request**

   - Provide a clear description
   - Reference any related issues
   - Include screenshots for UI changes

4. **Review Process**
   - Address review comments
   - Keep commits atomic (one logical change per commit)
   - Squash commits if requested

## Project Structure

### Key Directories

- `src/main/` - Electron Main Process code
- `src/renderer/` - React Renderer Process code
- `src/main/db/` - Database schema and services
- `docs/` - Documentation files
- `drizzle/` - Database migrations

### File Naming

- **Components:** PascalCase (`ArtistCard.tsx`)
- **Utilities:** camelCase (`utils.ts`)
- **Types:** PascalCase (`types.ts`)
- **Services:** PascalCase (`DbService.ts`)

## Common Tasks

### Adding a New IPC Method

1. **Define in Bridge** (`src/main/bridge.ts`)

   ```typescript
   export interface IpcBridge {
     // ... existing methods
     newMethod: () => Promise<ReturnType>;
   }
   ```

2. **Implement in Bridge**

   ```typescript
   const ipcBridge: IpcBridge = {
     // ... existing methods
     newMethod: () => ipcRenderer.invoke("channel:name"),
   };
   ```

3. **Add Handler** (`src/main/ipc.ts`)

   ```typescript
   ipcMain.handle("channel:name", async () => {
     // Implementation
   });
   ```

4. **Update Types** (`src/renderer.d.ts`)
   ```typescript
   export interface IpcApi {
     // ... existing methods
     newMethod: () => Promise<ReturnType>;
   }
   ```

### Adding a New Database Table

1. **Add Schema** (`src/main/db/schema.ts`)
2. **Generate Migration** (`npm run db:generate`)
3. **Update Service** (`src/main/db/db-service.ts`)
4. **Test Migration** (`npm run db:migrate`)

## Questions?

If you have questions about contributing:

1. Check existing documentation
2. Review similar code in the codebase
3. Open an issue for discussion

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

