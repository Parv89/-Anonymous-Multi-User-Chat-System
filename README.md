# AI chatbot

mplementation Plan - Anonymous Multi-User Chat System (DeviX-task1)

Build a real-time, zero-login, highly secure anonymous chat application using React (Vite), Socket.io (Node/Express), and Tailwind CSS. Users auto-generate a randomized anonymous alias upon entering, participate in public themed chat rooms, enjoy real-time user presence counts, profanity/spam protection, auto-scrolling, 24-hour message lifecycle auto-deletion, and a sleek dark privacy theme.

Technical Stack & Architecture

Frontend: React 18 + Vite + Tailwind CSS + Lucide Icons + Socket.io-client + Canvas Confetti / Audio utils.

Backend: Node.js + Express + Socket.io + Bad-Words / Custom Profanity Engine + In-Memory Store with 24-Hour Expiration Purger.

Styling & Theme: Tailwind CSS with dark mode as default ("Privacy Dark" aesthetic with subtle glows and sleek glassmorphism).

Key Features & Requirements Coverage

Anonymous Session Management:

Auto-generated random username on mount (e.g. SilentPanda42, CyberFox88, NeonOwl19).

Avatar generation based on randomized gradient/seed.

Display name modification restricted to once per session with visual confirmation modal.

Multi-Room Real-Time Engine:

Rooms: #General, #Confessions, #Advice, #Random, #Tech-Talk.

Real-time room switching, live user presence count per room.

System join/leave announcements.

Messaging & UX Integrity:

Instant socket communication (send, receive, typing indicators).

Message character limit (500 chars) with live counter ring and empty message blocker.

Timestamps formatted relatively and absolutely.

Smooth auto-scroll with a "New messages below" floating pill when scrolled up.

Emoji reactions on individual messages.

Security & Privacy Safeguards:

24-Hour Auto-Delete Purge: Backend background job prunes messages older than 24 hours. Messages show a "Self-destructs in 24h" badge.

Profanity & Content Moderation: Client & server filtering to sanitize toxic words or flag spam.

Spam Control: Rate limiter enforcing minimum interval between consecutive messages (e.g., max 3 messages per 5 sec).

Responsive & Privacy-Centric UI:

Default Dark Theme with optional light/dark toggle.

Mobile responsive layout with slide-out room navigation sidebar.

Sound notification toggle and room search filter.

User Review Required

NOTE

The backend server and frontend Vite app will be integrated into a unified project layout (DeviX-task1) with concurrent npm start scripts for easy local execution.

Proposed Changes

Component 1: Application Structure & Configuration (DeviX-task1/)

[NEW] package.json

Setup dependencies (express, socket.io, socket.io-client, react, react-dom, lucide-react, tailwindcss, vite, concurrently).

[NEW] vite.config.js

Configure Vite with React plugin and dev proxy to Socket.io backend port (http://localhost:3001).

[NEW] tailwind.config.js & postcss.config.js

Setup Tailwind styling directives with dark mode configuration.

Component 2: Backend Socket.io & Moderation Server (DeviX-task1/server/)

[NEW] server.js

Express + Socket.io server.

Room presence tracking (usersInRoom).

In-memory message store with 24h timestamp pruning (cleanupOldMessages).

Socket event handlers: join_room, send_message, typing, add_reaction, change_username, leave_room.

Rate-limiting spam middleware and profanity filter integration.

[NEW] moderation.js

Custom profanity detection & sanitization utility.

Component 3: Frontend Client (DeviX-task1/src/)

[NEW] src/App.jsx

Root component with theme state, user session initialization, socket connection setup, and main layout structure.

[NEW] src/components/Sidebar.jsx

Room listing sidebar with active online counts, privacy badge, user profile card, and mobile drawer toggle.

[NEW] src/components/ChatHeader.jsx

Active room header displaying room title, description, online count, dark mode toggle, and privacy status.

[NEW] src/components/MessageList.jsx

Message feed with smooth auto-scroll, message bubbles, self vs other styling, system event badges, reactions, and floating scroll-to-bottom button.

[NEW] src/components/MessageInput.jsx

Message input textarea, live 500-character counter, emoji picker toggle, typing indicators, and send button.

[NEW] src/components/NameChangeModal.jsx

Modal dialog allowing one-time display name edit per session with validation.

[NEW] src/utils/nameGenerator.js

Random username generator combining creative adjectives and animals with numbers (e.g. AnonymousPanda42).

Verification Plan

Automated Tests & Checks

Code linting and package build execution via npm run build.

Verify Node server startup without exceptions on node server/server.js.

Manual Verification

Open multiple browser tabs to simulate multiple anonymous users joining #General, #Confessions, #Advice, #Random, and #Tech-Talk.

Test real-time messaging, typing indicators, and emoji reactions.

Test character limit counter, profanity censorship, and spam rate limiting.

Verify display name change (confirming it locks after 1 change per session).

Verify live online user count per room updating dynamically when users enter/leave.

Verify responsive drawer layout on simulated mobile viewports.

Verify dark mode toggle. make like this not copied form ai

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cb701d99-5306-4d19-8e20-0f1d66d975c9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
