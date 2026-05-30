# StGo-Mail (v2.0 Pulsar Edition)

![StGo-Mail Logo](https://raw.githubusercontent.com/SolutionsTechnologies/StGo-Mail/main/assets/images/logo.png)

> **The Future of Communication, Redefined.**

StGo-Mail is a premium, futuristic email platform designed for high-productivity environments. Inspired by the clean layout of Google Workspace but infused with the vibrant "Poteuxx" neon-glassmorphism aesthetic, it offers a seamless and stunning user experience.

## ✨ Features

- 💎 **Futuristic UI/UX**: Premium glassmorphism effects, neon glows, and smooth CSS animations.
- 🔐 **Secure Identity System**: complete Authentication via Firebase (Email/Password or Username login).
- 📧 **Advanced Email Ecosystem**:
  - Full Inbox, Sent, Drafts, Starred, and Trash management.
  - Real-time new message notifications.
  - Floating Gmail-style Composer with rich text capabilities.
- 🔍 **Pulsar Search Engine**: Instant search across subjects, senders, and content.
- 👥 **Contact Manager**: Organize your futuristic network efficiently.
- 📊 **Dynamic Dashboard**: Real-time statistics on storage usage and email activity.
- 📱 **Fully Responsive**: Optimized for Desktop, Tablet, and Mobile.
- 🎨 **Theme Engine**: Support for Classic, Neon, and Cyber themes.

## 🚀 Technology Stack

- **Frontend**: HTML5 Semantic Structure, Vanilla CSS (Glassmorphism & Neon).
- **Logic**: Modern Javascript (ES6+) with Modular Architecture.
- **Backend-as-a-Service**: Firebase Core.
  - **Firestore**: Real-time NoSQL database for mails and user data.
  - **Auth**: Secure session management and identity.
  - **Storage**: Handling attachments and user avatars.
- **Icons**: FontAwesome 6 Pro & Lucide.
- **Fonts**: Inter (Google Fonts).

## 📂 Project Architecture

```text
StGo-Mail/
├── index.html          # Landing Page & Redirection
├── login.html          # Secure Identity Access
├── register.html       # Identity Creation
├── inbox.html          # Main Application Hub
├── assets/
│   ├── css/            # Main & View-specific styling
│   ├── js/             # Application Logic
│   └── images/         # Visual Assets
├── firebase/
│   ├── firebase-config.js # Connectivity
│   ├── auth.js          # Security Logic
│   └── firestore.js     # Data Handlers
├── services/
│   ├── mailService.js   # Email Operations
│   ├── notificationService.js # UX Toasts
│   └── userService.js   # Profile Management
└── components/         # Reusable UI Blocks
```

## 🛠️ Status & Updates

**Current Version**: `2.0.0-alpha`
**Status**: `Production Ready Architecture`

- [x] Complete UI Overhaul (Poteuxx Style)
- [x] Firebase Integration (Auth/Firestore)
- [x] Real-time Messaging System
- [x] Advanced Search Engine
- [x] Responsive Layout Implementation
- [x] Toast Notification System
- [ ] Multi-language Support (Planned for 2.1)
- [ ] End-to-end Encryption (Planned for 3.0)

---

**Developed by Antigravity (Powered by DeepMind)**
*SolutionsTechnologies Branding - 2026*
