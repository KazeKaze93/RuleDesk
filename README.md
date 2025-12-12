# NSFW-Booru-Desctop-Client-Unofficial-

# 💻 NSFW Booru Desktop Client (Unofficial)

> A modern, secure desktop companion built on Electron and React/TypeScript for browsing and organizing booru-style imageboard content via its public API. Designed for performance and maintainability.

---

## 📸 Gallery

### Dashboard

![Dashboard Screenshot](./docs/screenshots/dashboard.png)
_Main application interface showing the dashboard with navigation and content overview._

### Search Interface

![Search Interface Screenshot](./docs/screenshots/search.png)
_Advanced search and filtering interface for discovering content._

### Image Viewer

![Image Viewer Screenshot](./docs/screenshots/image-viewer.png)
_Full-screen image viewer with metadata and navigation controls._

---

## ⚠️ Disclaimer & Risk Assessment

This project is **unofficial** and **not affiliated** with any external website or company.

- **Content Risk:** The application does **not** host, redistribute, or bundle any media. All content is loaded directly from the original website's API or CDN. Users are responsible for adhering to local laws regarding NSFW content and the target website’s API Terms of Service (ToS).
- **API Risk (Polling):** The Core Services are implemented with strict **Exponential Backoff** and **Rate Limiting** to minimize the risk of IP/key bans due to abusive polling behavior.
- **Security Posture:** The application is configured with mandatory Electron security hardening (Context Isolation, Preload Scripts) to prevent any potential Remote Code Execution (RCE) via the renderer process.

---

## ✨ Features

| Feature                           | Description                                                                                                                                                                                                                             |
| :-------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **🔐 API Authentication**         | Secure onboarding flow for Rule34.xxx API credentials (User ID and API Key). Credentials stored in SQLite database, accessible only from Main Process.                                                                                  |
| **👤 Artist Tracking**            | Track artists/uploaders by tag or username. Add, view, and delete tracked artists. Supports both tag-based and uploader-based tracking.                                                                                                 |
| **🔄 Background Synchronization** | Sync service fetches new posts from Rule34.xxx API with rate limiting (1.5s delay between artists, 0.5s between pages). Implements exponential backoff and proper error handling.                                                       |
| **💾 Local Metadata Database**    | Uses **SQLite** via **Drizzle ORM** (TypeScript mandatory). Stores artists, posts metadata (tags, ratings, URLs), and settings. Database file access is strictly limited to the **Main Process** to enforce thread-safety and security. |
| **🖼️ Artist Gallery**             | View cached posts for each tracked artist in a responsive grid layout. Shows preview images, ratings, and metadata. Click to open external link to Rule34.xxx.                                                                          |
| **📊 Post Metadata**              | Cached posts include file URLs, preview URLs, tags, ratings, and publication timestamps. Enables offline browsing and fast filtering.                                                                                                   |

---

## 🏗️ Architecture Overview & Tech Stack

The application adheres to a strict **Separation of Concerns (SoC)** model:

### 1. Core Services (The Brain - Electron Main Process)

This is the secure Node.js environment. It handles all I/O, persistence, and secrets.

- **Desktop Runtime:** **Electron** (chosen for `BrowserView`/`Webview` control to support DOM injection).
- **Database:** **SQLite** (via `better-sqlite3` driver).
- **Data Layer:** **Drizzle ORM** (TypeScript type-safety for queries).
- **API:** Custom wrapper based on `fetch`/`axios` with retry and backoff logic.
- **Background Jobs:** Node.js timers and asynchronous workers.

### 2. Renderer (The Face - UI Process)

This is the sandboxed browser environment. It handles presentation.

- **Frontend:** **React + TypeScript**
- **Styling:** **Tailwind CSS + shadcn/ui** (modern UI, good baseline A11y).
- **State Management:** **Zustand** (minimalistic state layer, aligned with KISS/YAGNI).
- **Data Fetching:** **TanStack Query (React Query)** (caching, loading states, API boundary).

### 3. Security Boundary (The Gatekeeper)

- **IPC Bridge:** Strictly typed TypeScript interface (`bridge.ts`) used by the Renderer to communicate with the Main Process.
- **Security:** **Context Isolation** enforced globally; no direct Node.js access from the Renderer.

---

## 🚀 Quick Start

### First Launch

1. **Get API Credentials:**

   - Visit https://rule34.xxx/index.php?page=account&s=options
   - Copy your **User ID** and **API Key** from the API Access section

2. **Onboarding:**

   - Launch the application
   - Enter your User ID and API Key in the onboarding screen
   - Click "Сохранить и Войти" (Save and Login)

3. **Add Artists:**

   - Click "Add Artist" button
   - Enter artist name and tag
   - Select type (tag or uploader)
   - Click "Add"

4. **Sync Posts:**
   - Click "Sync All" to fetch posts from Rule34.xxx
   - Wait for synchronization to complete
   - Click on an artist to view their gallery

---

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

- **[API Documentation](./docs/api.md)** - IPC API reference and usage examples
- **[Architecture Documentation](./docs/architecture.md)** - System architecture and design patterns
- **[Contributing Guide](./docs/contributing.md)** - Guidelines for contributors
- **[Database Documentation](./docs/database.md)** - Database schema and operations
- **[Development Guide](./docs/development.md)** - Development setup and workflows

---

## ⚙️ Development Setup

This project uses **Vite** as the build tool for both the Electron Main and Renderer processes, ensuring optimal build performance.

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/booru-desktop-client.git
cd booru-desktop-client

# Install dependencies
npm install

# Start the application in development mode
# This runs the Vite dev server for the Renderer and starts the Electron Main process.
npm run dev
```

### Configuration

The application stores configuration in SQLite database:

- **API Credentials:** Stored securely in the `settings` table (User ID and API Key)
- **Database Location:** Electron user data directory (automatically managed)
- **No Environment Variables Required:** All configuration is handled through the UI

### Building the Binary

To package the application for distribution:

```bash
# Build for current platform
npm run build

# Package with electron-builder (after build)
npx electron-builder
```

The built binaries will be available in the `dist/` directory. The exact output location may vary depending on your Electron builder configuration.

### Quality Checks

Run the following commands to ensure code quality:

```bash
# Type checking
npm run typecheck

# Run linter to check code style and potential issues
npm run lint

# Run both (validation)
npm run validate
```

📜 License

This project is licensed under the MIT License.

You are free to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software, subject to the conditions of the MIT License.

The full license text is available in the LICENSE
file in this repository.

🧾 Legal Disclaimer

By using this software, you acknowledge and agree to the following:

18+ Only:
This application is intended exclusively for adults (18+) in jurisdictions where viewing NSFW content is legal.

No Content Hosting:
The application does not host, store, mirror, or redistribute any media content.
All media is requested directly from the original website’s API/CDN at the user’s initiative.

Use at Your Own Risk:
The authors and contributors of this project:

Do not control the content provided by third-party services.

Do not endorse, moderate, or curate any content accessed through this software.

Are not responsible for how you use this software or which content you access with it.

**Compliance with Laws & ToS:**
You are solely responsible for:

- Complying with the laws and regulations applicable in your country/region.
- Complying with the target website's Terms of Service, API rules, and any usage limitations (including rate limits and content policies).

The software is provided "as is", without warranty of any kind, express or implied. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the software.

---

## ⚙️ Database Management

### Migrations

If you modify the database schema (`src/main/db/schema.ts`):

```bash
# Generate migration from schema changes
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio to inspect database
npm run db:studio
```

**Note:** Migrations run automatically on application startup.

---

## 🛡️ Code Quality Standards

This project adheres to strict development principles:

- **Architecture:** SOLID, DRY, KISS, YAGNI principles
- **TypeScript:** Strict typing, no `any` or unsafe casts
- **Error Handling:** Proper error handling with descriptive messages
- **Security:** Context Isolation, no direct Node.js access from Renderer
- **Database:** Type-safe queries via Drizzle ORM, no raw SQL
- **UI:** Tailwind CSS only, no inline styles, accessibility considerations

See [Contributing Guide](./docs/contributing.md) for detailed guidelines.
