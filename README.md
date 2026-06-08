# StGo-Mail (v2.1 Pulsar Edition)

![StGo-Mail Logo](https://raw.githubusercontent.com/SolutionsTechnologies/StGo-Mail/main/assets/images/logo.png)

> **The Future of Private Communication, Redefined with E2EE and Real-World Connectivity.**

StGo-Mail is a premium, futuristic email platform designed for high-privacy environments. Infused with the vibrant "Poteuxx" neon-glassmorphism aesthetic, it offers a secure, stunning, and globally connected user experience.

## ✨ Pulsar Version 2.1 Enhancements

- 🔐 **Double-Shield End-to-End Encryption (E2EE)**: 
  - Industry-standard **RSA-2048** and **AES-GCM 256** encryption.
  - Messages are encrypted on the sender's device and decrypted only on the recipient's device. 
  - **Not even the server can read your private communications.**
- 🌍 **Global Localization (i18n)**:
  - Full support for **Multi-language** environments.
  - Switch between **English** and **French** instantly from the settings.
  - Persistent language preferences via local storage.
- 🌉 **Real-World Mail Bridge**:
  - Receive "real" external emails (OTP codes, verification links) from any service (Google, Netflix, Banks, etc.).
  - Automatic background synchronization with functional external aliases.
  - Dedicated **BRIDGE** tags for external mail clarity.
- 🎨 **Perfected Interaction Physics**:
  - **Modern Slide-in Reader**: A high-end glassmorphic reading experience with fluid transitions.
  - **Real-Time UI**: Instant star-toggling, deletion, and message sync without page reloads.
  - **Staggered Animations**: Enhanced "Poteuxx" slide-in effects for a premium feel.

## 🚀 Core Technology Stack

- **Frontend**: HTML5 Semantic Structure, Vanilla CSS (Glassmorphism & Neon).
- **Security**: Web Crypto API (RSA/AES), Secure Identity Mapping.
- **Backend-as-a-Service**: Firebase Suite (Firestore, Auth, Storage).
- **Connectivity**: 1secmail API Bridge for external mail reception.
- **Interactions**: Custom GSAP-style CSS animations and modular JS architecture.

## 📂 Project Architecture

```text
StGo-Mail/
├── index.html          # Premium Landing Page & Redirection
├── login.html          # Secure Identity Access (Localized)
├── register.html       # Identity Creation (Bridge-enabled)
├── inbox.html          # Main Application Hub (Pulsar Interface)
├── locales/            # i18n Translation Files (EN/FR)
├── services/
│   ├── cryptoService.js # E2EE Engine (Web Crypto)
│   ├── i18n.js          # Localization Service
│   ├── mailService.js   # Email Ops & World Bridge Sync
│   └── notificationService.js # UX Toasts
├── assets/
│   ├── css/            # Main & View-specific styling
│   └── js/             # Application Logic (inbox.js)
└── firebase/           # Connectivity & Auth logic
```

## 🛠️ Status & Implementation

**Current Version**: `2.1.0`
**Status**: `Production Stable`

- [x] **Double-Shield E2EE Implementation**
- [x] **Multi-language Support (i18n)**
- [x] **Real-World External Mail Bridge**
- [x] **Premium UI Overhaul (Pulsar Design)**
- [x] **Real-time Messaging & Notifications**
- [x] **Identity Identity Mapping (@stgo.io, @identity.io, etc.)**

---

**Developed by Antigravity (Powered by Google DeepMind)**  
*SolutionsTechnologies Branding - 2026*  
[poteuxx.github.io/st-gomail](https://poteuxx.github.io/st-gomail)
