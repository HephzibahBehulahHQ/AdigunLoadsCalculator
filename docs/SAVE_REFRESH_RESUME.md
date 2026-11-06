# Saving, refresh and resume

## What changed

The platform now starts each document load with a fresh project setup interview. It does not restore an old active-project pointer and does not autosave each edit. Existing saved projects remain in IndexedDB and can be opened deliberately with **Resume project**.

**Save project** (or Ctrl/Cmd+S) captures the current project, setup answers and step, supported BOT conversation/composer and the current customer bill in a durable checkpoint. Finish or apply an open editor before saving the project; otherwise the app explains which unfinished input needs attention. Measured datasets retain their explicit **Save measured data** workflow. A saved project includes the relevant project identity that links those datasets.

The customer bill's **Save draft locally** action also saves its associated project checkpoint, so a saved bill is discoverable through Resume project even when its project was previously new.

## Refresh defect and lifecycle

The previous lifecycle treated an autosaved working copy as the saved project and selected a prior project automatically during startup. It therefore could not satisfy a request to discard unsaved work on the next load. Workspace rendering also waited for IndexedDB opening/migration, which had no overall deadline; an unresponsive storage request could leave the startup screen waiting indefinitely.

The repair separates those concerns:

1. The fresh workspace renders immediately, independently of the saved-project list.
2. Startup database opening and migration share an eight-second deadline. Failure is visible and retryable; late results from abandoned attempts cannot replace a later connection. Existing records are retained.
3. Temporary working state exists in the page's memory. A new load does not read that state back or alter explicit checkpoints.
4. Only explicit save actions update durable checkpoints. The user can choose a saved project and resume it after a reload.

These are defects found in the existing control flow. A storage stall is also exercised through controlled regression tests; it is not claimed to explain every possible browser or extension failure.

## Standard browser warning

The beforeunload handler synchronously checks project/session changes, customer bills and unfinished editors. Only when unsaved data exists does it call `event.preventDefault()` and set `event.returnValue`. It does not perform asynchronous saving, clear data, change React state, reload the page or show a second confirmation dialog.

Cancelling the browser dialog leaves the current page and its in-memory work intact. Accepting a refresh creates a fresh interview. The previously committed checkpoint is unchanged, including when later edits were discarded.

Read/export activity by itself is not unsaved user data. Separate update guards can still prevent a service-worker update while an operation is running.

Browsers choose the dialog wording and generally require prior user interaction. Some mobile termination paths do not deliver beforeunload, so the visible Save project action remains essential. See the [MDN beforeunload reference](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event).

## Storage model

| Data | Where it lives | What survives refresh |
| --- | --- | --- |
| Working project, setup progress, unsubmitted BOT command, temporary bill edits | Current page memory | Nothing unless explicitly saved |
| Explicit project and session checkpoint | IndexedDB `projects` store | Last committed checkpoint |
| Saved project revisions | IndexedDB `history` store | Committed revision history |
| Saved customer bill | IndexedDB `bills` store, keyed by project ID | Last committed bill |
| Saved measured dataset | IndexedDB `measurements` store | Last explicitly saved dataset |
| Theme, language and window layout | Harmless local preferences | Preferences only; they cannot select an active project on startup |
| Downloaded workspace backup | File chosen and retained by the user | Portable recovery independent of the browser profile |

Existing records are retained for compatibility. Earlier versions did not identify whether a project record originated from autosave or a manual save, so the update conservatively exposes all valid prior records through Resume project rather than deleting potentially valuable work.

## Save correctness and conflicts

A successful IndexedDB request is not sufficient to show Saved locally. The complete project/history/bill transaction must finish. Quota errors, transaction aborts, timeouts and optimistic revision conflicts produce a visible failure, retain dirty state and preserve the old committed record.

Each checkpoint has a separate ID as well as the engineering revision. This catches concurrent edits to interview/BOT state even when no engineering field changed. A bill has its own expected revision. A conflict aborts the combined checkpoint instead of partially committing one part.

The save captures data before waiting. Edits made while it is writing remain in memory and remain marked unsaved. Completing an older snapshot cannot label later edits Saved.

Restored BOT messages are readable history. Pending processing is not persisted, and restored proposals are inactive until reviewed/regenerated against the current project.

## Help without losing work

Help & Support opens a separate modal over the existing workspace. F1 also opens it from inside an editor. Existing forms remain mounted; focus stays within the guide and returns when it closes. Search, topic selection and worked examples do not modify the active project. See the [complete beginner guide](USER_GUIDE.md).

## Verification

The release evidence, command results, tested revision and remaining limitations are recorded in [TEST_EVIDENCE.md](TEST_EVIDENCE.md). Focused cases cover native cancel/accept reload behavior, tab-close cancellation, exact partial-interview resume, delayed/failed transactions, customer-bill atomicity, a pristine page without warnings, Help search, keyboard behavior and narrow-screen layout.
