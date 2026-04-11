# CLAUDE.md

Guidance for Claude Code (and other AI assistants) working in this repository.

## Project overview

**Leafology Daily EOD** (package name `to-do-to-day-eod`) is a local-first
Progressive Web App for fast daily task capture and end-of-day reporting,
designed for a single user (the Leafology owner). Originally bootstrapped from
Google AI Studio. The app features smart task rollover, a compact task list
UI, a markdown EOD report builder, optional Firebase/Firestore sync, and
several Gemini-powered AI helpers.

Key properties to keep in mind:
- **Local-first**: All state lives in IndexedDB (`services/db.ts`). Firestore
  sync is optional and layered on top via `services/firestoreSync.ts`.
- **Single-user app**: No multi-tenant concerns. Settings and tasks are
  scoped per signed-in Firebase user when sync is enabled.
- **PWA**: Registered service worker (`public/service-worker.js`) and
  manifest (`public/manifest.json`) for installable/offline use.

## Tech stack

- **React 19** with TypeScript (strict TSX, `react-jsx` runtime, no emit —
  Vite handles transpilation).
- **Vite 6** (`vite.config.ts`) with a `@/*` path alias to the repo root.
- **Tailwind CSS** via CDN (`<script src="https://cdn.tailwindcss.com">` in
  `index.html`). There is no local Tailwind config or PostCSS — all styling
  is inline utility classes.
- **IndexedDB** via a tiny hand-rolled wrapper in `services/localDb.ts`
  (intentionally no `idb-keyval` dependency).
- **Firebase 12** (`firebase/app`, `firebase/auth`, `firebase/firestore`)
  for optional Google sign-in and cross-device sync.
- **@google/genai** (Gemini) for all AI features. Models used:
  `gemini-2.5-flash`.
- **pako** for gzip compression of backup exports.
- **ES module import map** in `index.html` — browser resolves `react`,
  `firebase/*`, `@google/genai`, `pako` from CDNs at runtime. `npm install`
  is still needed so TypeScript and Vite can resolve types during dev/build.

## Commands

```bash
npm install        # install dev deps (TS, Vite, @types/node)
npm run dev        # start Vite dev server
npm run build      # type-less Vite production build (tsconfig has noEmit)
npm run preview    # serve the built bundle
```

There are **no tests, linter, or formatter** configured. Do not invent
`npm test` / `npm run lint` commands — they do not exist. If you need to
validate TypeScript, run `npx tsc --noEmit`.

### Environment variables

Create `.env.local` in the repo root with:

```
GEMINI_API_KEY=your_gemini_api_key
```

`vite.config.ts` injects this into both `process.env.API_KEY` and
`process.env.GEMINI_API_KEY` at build time. `services/gemini.ts` reads
`process.env.API_KEY` and **throws at module load** if it is missing —
the whole app will fail to boot without a key.

Firebase config is **not** an env var. Users paste their `firebaseConfig`
JSON into Settings > Cloud Sync at runtime; it is stored in `localStorage`
under the key `firebaseConfig` (see `services/firebase.ts`).

## Repository layout

```
.
├── App.tsx              # Top-level React component — most app logic lives here
├── index.tsx            # Mounts <App /> and registers the service worker
├── index.html           # HTML shell, import map, Tailwind CDN, manifest link
├── types.ts             # All shared domain types + const tuples (CATEGORIES, STATUSES, ...)
├── utils.ts             # Pure display helpers (e.g. formatSchedule)
├── vite.config.ts       # Vite config + env injection + @/* alias
├── tsconfig.json        # TS config (ES2022, bundler resolution, noEmit)
├── metadata.json        # AI Studio app metadata
├── package.json
├── components/          # Presentational + modal React components
├── services/            # Data, sync, and AI service modules
└── public/              # Static assets (manifest, service worker, icons)
```

### `components/`

All components are function components, default-exported named exports
(`export const Foo: React.FC<...>`), TSX with inline Tailwind classes.
Key ones:

- `TaskItem.tsx` — inline-editable task row with status/category/priority
  pills, comment thread, and slash-phrase macros (`/side`, `/app`, `/data`).
- `AddTaskModal.tsx`, `NewProjectModal.tsx`, `NewIdeaModal.tsx` —
  creation modals. Projects and recurring tasks route through special paths
  in `db.ts`.
- `EODModal.tsx` — renders and copies/emails the end-of-day markdown report
  built by `services/eod.ts`.
- `EditRecurringTaskModal.tsx` — choice dialog ("just this one" vs. "all
  future") when editing a recurring instance's template-level fields.
- `TaskDetailModal.tsx` — expanded task view with comments and actions.
- `AINotetakerModal.tsx`, `AIHelperModal.tsx`, `VibeAI.tsx`, `HelpBot.tsx`
  — Gemini-powered chat surfaces.
- `FilterSortControls.tsx`, `GettingStartedCard.tsx`, `AuthDisplay.tsx`,
  `SettingsModal.tsx`, `RecurringTaskForm.tsx`, `Icons.tsx`.

### `services/`

- **`db.ts`** — IndexedDB-backed task and settings store. Object stores:
  `tasks` (keyPath `id`) and `settings` (key `'main'`). Exposes
  `getAllTasks`, `addTask`, `addTasks`, `addProjectTasks`, `updateTask`,
  `updateRecurringTemplate`, `activateNextProjectTask`, `deleteTask`,
  `getSettings`, `updateSettings`, `clearAndRestoreDatabase`, `putTasks`.
  This is the source of truth for local state.
- **`localDb.ts`** — tiny promise wrapper over the native `IDBDatabase`
  API. Augments the db with `.get<T>`, `.getAll<T>`, `.put`, `.delete`,
  and a `.transaction().done` promise. Intentionally zero-dependency.
- **`firebase.ts`** — lazy Firebase app/auth/firestore initialization,
  reads config from localStorage, exposes `initializeFirebase`,
  `onAuthChange`, `signInWithGoogle`, `doSignOut`, `getFirebaseConfig`,
  `saveFirebaseConfig`, and enables `enableIndexedDbPersistence`.
- **`firestoreSync.ts`** — two-way sync between local IDB and Firestore
  under `users/{uid}/tasks/{taskId}` and `users/{uid}/data/settings`.
  Conflict strategy is last-write-wins based on `updatedAt`. `settings`
  treat remote as source of truth on initial sync. Converts between ISO
  strings (local) and Firestore `Timestamp` (remote).
- **`sync.ts`** — local backup/restore. Serializes `{tasks, settings,
  exportFormat: 'leafology-v1', timestamp}`, gzips with pako, base64-
  encodes, and downloads as a `.txt` file. Import reverses the pipeline
  and calls `clearAndRestoreDatabase`. Also drives the **hourly
  autosave** kicked off from `App.tsx` (`resetAutosaveTimer`).
- **`eod.ts`** — pure function `buildEOD(dateISO, tasks, settings)` that
  returns the EOD markdown string (KPIs, at-a-glance counts, top 3 wins,
  blockers & asks, notes, carryover). Also exports a simple
  `applyToneGuard` that redacts negative phrases about ownership.
- **`gemini.ts`** — all AI entry points, using `@google/genai`:
  - `generateProposal`
  - `startProjectChat` / `createProjectFromChat` (streams + JSON schema)
  - `processNoteWithAI` — parses a free-text note into `AISuggestedTask[]`
  - `getHelpBotResponse` — support/troubleshooting bot ("Leafy")
  - `getVibeAIChatResponse` — simulates Leafology team members
  - `getAIHelperResponse` — per-task assistant
  Hardcoded model: `gemini-2.5-flash`. Throws on missing `API_KEY` at
  module load.

### `public/`

- `manifest.json` — PWA manifest (standalone display, Leafology branding).
- `service-worker.js` — simple cache-first SW. Registered from `index.tsx`.
  Cache name `leafology-eod-cache-v1`; bump this string when you invalidate
  the cache.
- `icons/` — PWA icon PNGs.

## Domain model (read this before editing task logic)

Defined in `types.ts`. The `Task` type is the core entity:

```ts
interface Task {
  id: string;
  date: string;               // 'YYYY-MM-DD'. Empty string = recurring template (hidden from daily view).
  title: string;
  category: Category;         // one of CATEGORIES
  status: Status;             // 'todo' | 'doing' | 'done'
  disposition: Disposition;   // 'normal' | 'muted' | 'ignored' | 'retired'
  priority: Priority;         // 'low' | 'medium' | 'high'
  includeInEOD: boolean;
  starred: boolean;
  asks: boolean;
  comments: Comment[];
  createdAt: string;          // ISO
  updatedAt: string;          // ISO — drives sync conflict resolution
  taskType: TaskType;         // 'one-time' | 'project' | 'everyday' | 'weekly' | 'monthly'
  projectId?: string;
  originId?: string;          // For recurring: template has id === originId; instances point back to it
  projectTaskOrder?: number;
  totalProjectTasks?: number;
  daysOfWeek?: number[];      // 0..6, weekly tasks
  dayOfMonth?: number;        // 1..31, monthly tasks
  earlyReminder?: boolean;
}
```

Invariants and conventions — keep these intact when refactoring:

1. **Recurring templates** are Tasks where `id === originId` and `date === ''`.
   They are filtered out of the daily view in `App.tsx`'s
   `sortedAndFilteredTasks` via `!t.originId || t.id !== t.originId`.
   Instances are separate Task records pointing at the template via
   `originId` and carry a real `date`.
2. **Project tasks** share a `projectId` and are ordered by
   `projectTaskOrder`. Only the first step (`index === 0`) gets a `date` on
   creation; later steps are "activated" (given a date) when the previous
   one is marked `done` via `db.activateNextProjectTask`.
3. **Disposition** drives what appears in the daily list:
   - `retired` and `ignored` are permanently hidden.
   - `muted` is hidden today and auto-reset to `normal` on rollover.
   - `normal` is the default.
4. **Rollover** (`handleRollover` in `App.tsx`) runs when the user clicks
   the refresh button. It carries over yesterday's unfinished one-time and
   project tasks into today and materializes new instances for everyday /
   weekly / monthly templates. For monthly templates scheduled past the
   last day of the month (e.g. 31st in February), the instance is created
   on the last day instead. Rollover updates `settings.lastOpenedDate`.
5. **Timezone**: hardcoded to `'America/New_York'` in the Settings default.
   `getTodayISO(timezone)` in `App.tsx` derives today's date in that zone
   — do not replace with naive `new Date().toISOString().split('T')[0]`.
6. **`updatedAt`** must be bumped on every mutation. `db.updateTask`
   does this automatically; if you write directly via `db.put('tasks', ...)`
   (as `putTask` and `clearAndRestoreDatabase` do for sync), make sure
   the caller has already set `updatedAt`, otherwise last-write-wins sync
   will misbehave.

## Sync model

`App.tsx` wires everything together on sign-in:

1. `initializeFirebase()` reads config from localStorage; if absent, sync
   stays disabled and the app continues as pure local.
2. On `onAuthChange`:
   - `syncLocalAndRemote(uid)` performs a one-shot two-way merge by
     `updatedAt`.
   - `refreshTasks()` reloads React state from IDB.
   - `listenToFirestoreChanges(uid, handleRemoteUpdate)` subscribes to
     `onSnapshot` for both the tasks collection and the settings doc.
3. Every mutation handler in `App.tsx` (`handleAddTask`, `handleUpdateTask`,
   etc.) writes to **both** `db.*` (IDB) and `*Firestore` (remote) when a
   user is signed in. When adding new mutation paths, preserve this
   dual-write pattern or sync will silently drop writes.
4. Remote deletes are triggered when a task's disposition becomes
   `'retired'` — see `handleUpdateTask`.

## Coding conventions

- **TypeScript**: `strict` is not enabled, but code is written as if it
  were. Prefer typed React props interfaces. Domain enums are `as const`
  tuples in `types.ts`; derive union types with `typeof X[number]`.
- **React**: function components, hooks only, no class components, no
  external state library. Most mutations flow through handlers defined in
  `App.tsx` and are passed down as props.
- **Styling**: Tailwind utility classes inline. No CSS files, no
  CSS-in-JS. Tailwind is the CDN build, so there is no `tailwind.config.js`
  — the full default palette is available.
- **Imports**: relative within the project. The `@/*` alias is configured
  but rarely used — match the surrounding file's style.
- **No barrel files.** Import components and services directly from their
  source files.
- **Error handling**: mostly `try/catch` + `console.error` + `alert` for
  user-visible failures. Match this pattern rather than introducing a
  toast library.
- **IDs**: `crypto.randomUUID()` everywhere that task/project/origin IDs
  are minted. Do not use `Math.random` or timestamps for IDs.
- **Dates**: store as `'YYYY-MM-DD'` (local date) for `Task.date`, and
  as ISO strings for `createdAt`/`updatedAt`. When comparing daily
  tasks to "today", use the TZ-aware helper `getTodayISO`.

## Things to avoid

- **Do not run `npm test` / `npm run lint`** — they are not configured.
  Offering to run them wastes a round trip.
- **Do not add a Tailwind config** unless the user is migrating off the
  CDN; mixing config-driven Tailwind with the CDN version silently breaks.
- **Do not remove the import map** in `index.html` — the app relies on
  CDN resolution for React/Firebase/genai/pako in the browser.
- **Do not hardcode secrets** (Gemini or Firebase) in the source. Gemini
  key comes from `.env.local`; Firebase config is runtime user input.
- **Do not store `Date` objects in IndexedDB records** — use ISO strings.
  Firestore conversion is handled explicitly in `firestoreSync.ts`.
- **Do not bypass `db.updateTask`** for task edits. It is the single place
  where `updatedAt` is refreshed.
- **Do not create an instance of a recurring template by copying `id`**.
  Clone it, delete `id`, let IDB assign a new one, and keep `originId`
  pointing at the template.

## Git workflow

- Default branch: `main`.
- Work Claude Code is doing lives on feature branches
  (currently `claude/add-claude-documentation-Xkuxo`). Develop, commit,
  and push to the designated branch. Never push to `main` without an
  explicit request.
- Do not open a pull request unless the user explicitly asks for one.

## Quick mental model for changes

- Adding a new task field → update `types.ts`, any creation handlers in
  `App.tsx`, the IDB migration defaults in `refreshTasks`, the EOD
  builder if user-visible, and make sure Firestore round-trips it (the
  spread in `taskToFirestore`/`taskFromFirestore` covers unknown keys
  automatically for primitives, but check Timestamp fields).
- Adding a new AI feature → add a function in `services/gemini.ts`, keep
  the `gemini-2.5-flash` model unless there's a reason to switch, and
  surface it from a new component in `components/`.
- Touching sync → re-read both `services/firestoreSync.ts` and the
  `handleRemoteUpdate` / `syncLocalAndRemote` flow in `App.tsx` before
  changing conflict resolution. Last-write-wins on `updatedAt` is load-
  bearing.
- Changing the EOD format → edit `services/eod.ts`. It's a pure function
  and the easiest place to iterate.
