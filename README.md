# Saturday 60

The three spin-class tools, published together as one installable web app (a PWA)
at **https://indoor-cycling.github.io/saturday60/**

Everything runs in the browser on your own device — no accounts, no server,
nothing uploaded.

---

## ⚠ Read this before changing anything

**The files in this repository are the live version. They are the only source of
truth.** A copy sitting in Downloads, attached to an old email, or pasted into a
chat weeks ago is not.

**If you are asking an AI assistant to revise a tool:** download the current file
from this repository and give it *that* file. Do not hand it an older copy and do
not let it rebuild one from memory. Every tool here carries shared machinery that
an older copy will silently lack:

- the app shell — `app.js`, the manifest and the icons, which provide the
  back-to-hub bar, the Save to… buttons and the offline install
- colour coding on drops, which the Build Sheet and the Drops Library Editor
  carry through without displaying
- song length, which travels from the Selector into the Build Sheet

A revision built from an earlier copy removes those without saying so, and the
loss only shows up later as missing colours or a page that no longer works
offline.

**After replacing any file, raise the version** on line 4 of `sw.js`
(`s60-v18` → `s60-v19`). That one word is what tells installed copies there is
something new. The hub screen shows the running version and has a
**Check for updates** button, so you can confirm an upload landed.

**To roll a change back,** upload the older files with a *higher* version number
(`s60-v19-rollback`). A version number only ever goes forward — re-uploading an
older one leaves every installed copy unaware anything changed.

---

## What's in here

| File | What it is |
|---|---|
| `index.html` | The hub — the screen you land on, linking the three tools |
| `selector.html` | Song BPM Selector (phone-first) |
| `buildsheet.html` | MOWL-style Build Sheet (desktop-first) |
| `drops.html` | Drops Library Editor |
| `app.js` | Shared shell: offline worker, back bar, Save to… buttons |
| `sw.js` | Service worker — stores the app for offline use. **Version lives here** |
| `manifest.webmanifest` | Name, icon and colours the phone installs with |
| `icons/` | App icons |

---

## A note on saved data

The browser stores each tool's data against the *web address*, so:

- All three tools share one storage area — a drops library saved in the Selector
  is the one the Build Sheet reads.
- Data lives per device. Backups and transfer codes are how work moves between
  a phone and a desktop.
- Data saved in the old standalone HTML files does **not** come across. Open the
  old file, press **Backup**, then press **Restore** in the app.
- Deleting the installed app can clear its storage on some phones. Press
  **Backup** now and then and keep the file somewhere safe.

**Backup** downloads the file as usual. **Save to…** beside it opens the phone's
share sheet (or the save dialog on a computer) so the file can go somewhere other
than the downloads folder. A phone shares it as `.txt` rather than `.json` —
identical contents, and Restore accepts either.
