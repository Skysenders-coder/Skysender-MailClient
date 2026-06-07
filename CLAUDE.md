# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# One-time setup
cp .env.example .env       # set SESSION_SECRET (32+ random chars)
npm install                # installs all workspaces (root + server + client)

# Development (hot reload)
npm run dev                # server on :3001 (tsx watch) + client on :5173 (vite)

# Production
npm run build              # tsc → server/dist/  &&  vite build → client/dist/
npm start                  # node server/dist/index.js  (serves client/dist at /)
```

Generate a session secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Architecture

npm workspaces monorepo: `server/` (Express + TypeScript) and `client/` (React + Vite).

### No database — ever

All email data is fetched live from IMAP. Credentials exist only in the server-side session (express-session MemoryStore). Logout destroys the session completely. Nothing is persisted.

### Host derivation

```typescript
const host = `mail.${email.split('@')[1]}`;   // IMAP :993 SSL, SMTP :465 SSL
```

### Backend (`server/src/`)

| File | Role |
|---|---|
| `services/MailFolderService.ts` | Pure: `deriveHost()`, `mapFolders()` — maps IMAP folder list to Inbox/Sent/Spam |
| `services/MailSessionService.ts` | Singleton `Map<sessionID, ImapFlow>` — one IMAP connection per logged-in user |
| `services/ImapService.ts` | All IMAP ops: connect, listFolders, listMessages (paginated, newest-first), getMessage (sanitized HTML via `sanitize-html`), markSeen |
| `services/SmtpService.ts` | Thin nodemailer wrapper — creates a transporter per call on port 465 |
| `middleware/auth.ts` | `requireSession` — checks session credentials + MailSessionService; returns 401 if either missing |
| `routes/auth.ts` | `POST /api/auth/login`, `POST /api/auth/logout` |
| `routes/mail.ts` | `GET /api/mail/folders`, `GET /api/mail/messages`, `GET /api/mail/messages/:id`, `POST /api/mail/send`, `POST /api/mail/reply` |

### Frontend (`client/src/`)

`App.tsx` owns the auth gate (`email` state: null = LoginPage, string = MailLayout).

`MailLayout` owns `selectedFolder`, `selectedMessageId`, `page` as local state. All server state is React Query (`@tanstack/react-query`).

| Component | Role |
|---|---|
| `LoginPage` | Email + password form, calls `api.login()` |
| `MailLayout` | Three-panel shell: header, FolderTabs, MessageList (left), MessageViewer (right) |
| `FolderTabs` | Folder switcher tabs + New Email button |
| `MessageList` | Paginated list (50/page), unread bolding, date formatting |
| `MessageViewer` | Full message display with sanitized `dangerouslySetInnerHTML`, Reply/Reply All buttons |
| `ComposeModal` | New Email + Reply (same component, `replyTo` prop). Pre-fills subject/to for replies, sends `inReplyTo`/`references` headers |

### Folder mapping

Mapped by `specialUse` attribute first (`\Sent`, `\Junk`), then by name:
- **Inbox**: `INBOX`
- **Sent**: `Sent` | `Sent Items` | `Sent Mail`
- **Spam**: `Spam` | `Junk` | `Junk E-mail`

Other folders are ignored entirely.

### Session lifecycle

Login → `ImapService.connect()` → store `ImapFlow` in `MailSessionService` map + credentials in `req.session`. Authenticated routes call `requireSession` which checks both. Logout calls `client.logout()` then `session.destroy()`. A 30-minute cleanup interval closes IMAP connections older than 24h.
