# Saturday 60

The three spin-class tools, packaged as one installable web app (a PWA).
Everything runs in the browser on your own device — no accounts, no server,
nothing uploaded.

## What's in here

| File | What it is |
|---|---|
| `index.html` | The hub — the screen you land on, with links to the three tools |
| `selector.html` | Song BPM Selector |
| `buildsheet.html` | MOWL-style Build Sheet |
| `drops.html` | Drops Library Editor |
| `app.js` | Shared shell: registers the offline worker, adds the back bar |
| `sw.js` | Service worker — stores the app so it opens with no signal |
| `manifest.webmanifest` | Tells the phone the name, icon and colours to install with |
| `icons/` | App icons |

The three tools are unchanged apart from a few lines added inside `<head>`
(the manifest link, the icon links and `app.js`).

## Publishing an update

1. Open `sw.js` and change `var VERSION = 's60-v1';` to `'s60-v2'`, then `v3`,
   and so on. One bump per upload.
2. Upload the changed files to the repository.
3. Open the app. Within a few seconds a bar appears at the bottom saying
   **A newer version is ready** — tap **Update now**.

If you forget to bump the version it still updates, it just takes an extra
launch to notice.

## A note on saved data

The browser stores each tool's data against the *web address*, so:

- All three tools here share one storage area — a drops library saved in the
  Selector is the one the Build Sheet sees.
- Data saved in the old standalone HTML files does **not** come across. Open
  the old file, press **Backup**, then press **Restore** in the tool here.
- Deleting the installed app from your home screen can clear that storage on
  some phones. Press **Backup** now and then and keep the file somewhere safe.
