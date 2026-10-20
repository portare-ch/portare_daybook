# Portare Daybook

A personal planner for tasks, long-term plans, and notes, organized around the worlds you define.

## Run locally

Requires Python 3. Node 22 or later is used for the optional checks. No dependency installation or build step is needed.

```sh
npm run dev
```

Open http://127.0.0.1:4173. `dist/` contains the complete static application.

## What works

- Today with a focus list, a selectable week, adjustable daily time capacity, and daily notes.
- Add, edit, complete, reopen, star, and delete tasks. Quick capture, life-area filters, time estimates, planned dates, and separate deadlines.
- Overdue and unfinished tasks stay visible in Today until completed or rescheduled.
- Inbox, Upcoming, Completed, and a dedicated view for each of your worlds.
- Create and rename worlds, choose colors and icons, add descriptions, and change their order. Removing a world moves its tasks, plans, and notes to another world you choose.
- Long-term plans with outcomes, optional target dates, status, linked tasks, and linked notes.
- Notes that save while typing, plus an archive of daily reflections.
- Search across task details, plans, notes, and daily reflections.
- JSON export and validated restore; undo for completion, deletion, and restore.
- Responsive layouts, keyboard-accessible dialogs, `/` to search, and `N` to add a task.

Starter worlds are Portare, PortareOS, Day job, and Personal. You can change them from the control beside **Your worlds** in the sidebar, or **Settings & backup → Manage worlds**. Keep at least one world to organize your content.

All initial tasks, plans, and notes are clearly marked as examples in the sample notice. **Start fresh** in that notice, or **Settings & backup → Remove sample content**, clears them while preserving your worlds, added or edited records, daily notes, and any sample plans your own work still references. The action offers Undo.

## Data and current boundaries

This draft stores everything in localStorage in this browser on this device. It has no server database, cross-device sync, calendar integration, notifications, or automatic backup. Export regularly using Settings & backup. A private deployment restricts access to the Site, but browser-local data is still tied to its browser profile and origin. Local preview and hosted copies therefore have separate data.

Plans can have any future target date. Daily capacity is a shared default, rather than a weekly working-hours calendar. Worlds are saved with your data and included in backups. Older backups are upgraded automatically; personal records are preserved when a retired starter world is removed.

## Sharing the source

The `portare-daybook` directory is the application repository. It includes examples to demonstrate the workflow; your browser-local tasks and notes are not part of the source. Personal backup exports, environment files, and local hosting identity in `.openai/` are ignored by Git. No hosting account or service credentials are needed to run the app.

To host it as a static site, serve the contents of `dist/` from any static host. Each browser and origin maintains its own separate data.

## Verify

```sh
npm test
npm run check
```

Source is plain HTML, CSS, and JavaScript. Fonts use Google Fonts with system fallbacks; core functionality has no external runtime dependency.
