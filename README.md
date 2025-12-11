# NSFW-Booru-Desctop-Client-Unofficial-


# 💻 NSFW Booru Desktop Client (Unofficial)

> A modern, secure desktop companion built on Electron and React/TypeScript for browsing and organizing booru-style imageboard content via its public API. Designed for performance and maintainability.

---

## ⚠️ Disclaimer & Risk Assessment

This project is **unofficial** and **not affiliated** with any external website or company.

- **Content Risk:** The application does **not** host, redistribute, or bundle any media. All content is loaded directly from the original website's API or CDN. Users are responsible for adhering to local laws regarding NSFW content and the target website’s API Terms of Service (ToS).
- **API Risk (Polling):** The Core Services are implemented with strict **Exponential Backoff** and **Rate Limiting** to minimize the risk of IP/key bans due to abusive polling behavior.
- **Security Posture:** The application is configured with mandatory Electron security hardening (Context Isolation, Preload Scripts) to prevent any potential Remote Code Execution (RCE) via the renderer process.

---

## ✨ Production-Grade Features

| Feature | Architectural Note (Separation of Concerns) |
| :--- | :--- |
| **🔔 New Post Notifier** | Handled by the **Main Process** (Background Polling Worker) using a scheduled, low-resource polling loop. Data persistence via SQLite. |
| **🔀 Randomizer & Advanced Filters** | API calls and complex filtering logic reside in the **Main Process** for security and performance. The UI (Renderer) sends clean commands via IPC. |
| **💾 Local Metadata Database** | Uses **SQLite** via **Drizzle ORM** (TypeScript mandatory). Database file access is strictly limited to the **Main Process** to enforce thread-safety and security. |
| **🧩 DOM Enhancements** | Implemented as an isolated **Content Script** (`site-injector.ts`) within a dedicated `BrowserView`/`Webview`. Communicates with the Main Process only via a dedicated, secure IPC channel. **This module is inherently fragile.** |
| **⬇️ One-Click Download** | The Renderer triggers a download request via **IPC**. The actual file download (I/O operation) is executed safely by the **Main Process** (Node.js). |
| **🏷 Tag Explorer / Stats** | Metadata fetched from the API is stored locally (SQLite), enabling rich client-side data analysis and charting. |

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

## ⚙️ Development Setup

This project uses **Vite** as the build tool for both the Electron Main and Renderer processes, ensuring optimal build performance.

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

## ⚙️ Configuration & API Access

- **API Key (If Required):** Store your API key (if any) in a protected location (e.g., local configuration file/Electron secure storage). **NEVER** commit secrets to the repository.

- **Drizzle ORM Schema:** If you modify the database schema, run:

```bash
npm run db:migrate
```

---

## 🛡️ Adherence to Code Quality Standards

- **Architecture:** Strict adherence to SOLID, DRY, KISS, YAGNI principles.

- **Backend/Scripting:** Type Hinting (TypeScript/Drizzle) is mandatory across the entire codebase. Proper error handling must be implemented; bare `try-except`/`catch (e)` is forbidden.

- **Frontend:** No use of `any`, `as` casting, inline styles, or magic numbers/strings. Accessibility (a11y) is a mandatory design consideration for all UI components.

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
