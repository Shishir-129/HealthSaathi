# 📂 Complete Files Guide for HealthAI

This document explains every important file in the project.

---

## 🔧 Configuration Files

### `package.json`
**What it does:** Lists all dependencies and scripts
**Important parts:**
- `dependencies`: Packages your app needs
- `scripts`: Commands like `npm run dev`, `npm run build`

### `vite.config.ts`
**What it does:** Configures the Vite build tool
**Don't modify unless:** You need custom build settings

### `.gitignore`
**What it does:** Tells Git which files to ignore (node_modules, dist, etc.)

### `postcss.config.mjs`
**What it does:** Configures PostCSS for Tailwind CSS
**Don't modify:** Already set up correctly

---

## 🌐 Entry Points

### `index.html`
**What it does:** The HTML file that loads your React app
**Location:** Root directory
**Key line:** `<script type="module" src="/src/main.tsx"></script>`

### `src/main.tsx`
**What it does:** React entry point - renders App to the DOM
**Code:**
```tsx
import App from './app/App'
ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
```

---

## 🎯 Core Application Files

### `src/app/App.tsx`
**What it does:** Main app component with RouterProvider
**Code:**
```tsx
import { RouterProvider } from "react-router";
import { router } from "./routes";

export default function App() {
  return <RouterProvider router={router} />;
}
```
**Purpose:** Sets up React Router for navigation

### `src/app/routes.tsx`
**What it does:** Defines all routes/pages in the app
**Routes:**
- `/` → Chat page (default)
- `/chat` → Chat page
- `/map` → Map page
- `/dashboard` → Dashboard page

**To add a new page:**
```tsx
{ path: "newpage", Component: NewPage }
```

---

## 🧩 Components

### `src/app/components/Layout.tsx`
**What it does:** Main layout with sidebar navigation
**Contains:**
- Logo and branding
- Navigation menu (Chat, Map, Dashboard)
- User profile section
- Outlet for page content

**Customize:**
- Line 16: Change app name "HealthAI"
- Lines 30-70: Navigation links
- Lines 75-87: User profile info

### `src/app/components/ui/*`
**What it does:** Reusable UI components (buttons, inputs, cards, etc.)
**From:** shadcn/ui component library
**Don't modify:** These are standard components
**Use:** Import and use in your pages

---

## 📄 Pages

### `src/app/pages/Chat.tsx`
**What it does:** AI chat interface
**Features:**
- Chat message bubbles
- Chat history sidebar
- New chat button
- Send message functionality

**Key sections:**
- `messages` state: Stores all chat messages
- `chatHistory` state: Stores previous conversations
- `handleSend`: Sends messages and simulates AI response

### `src/app/pages/Map.tsx`
**What it does:** Healthcare facilities map
**Features:**
- Map container with markers
- Facility list sidebar
- Search functionality
- Facility details (ratings, hours, distance)

**Key sections:**
- `facilities` state: List of healthcare facilities
- Map visualization with colored markers
- Legend for facility types

### `src/app/pages/Dashboard.tsx`
**What it does:** Health statistics dashboard
**Features:**
- Health metrics cards (heart rate, steps, sleep, activity)
- Line chart for heart rate
- Bar chart for sleep duration
- Pie chart for activity breakdown
- Health events timeline

**Key sections:**
- Mock data for charts
- Recharts components
- Trend indicators (up/down arrows)

---

## 🎨 Styles

### `src/styles/index.css`
**What it does:** Main CSS file that imports all other styles
**Imports:**
- `fonts.css` - Font definitions
- `tailwind.css` - Tailwind CSS
- `theme.css` - Custom theme variables

### `src/styles/tailwind.css`
**What it does:** Imports Tailwind CSS layers
**Don't modify:** Standard Tailwind setup

### `src/styles/theme.css`
**What it does:** Custom CSS variables and theme
**Customize:** Change colors, fonts, spacing here

### `src/styles/fonts.css`
**What it does:** Font imports (Google Fonts, etc.)
**Add fonts here:** New font imports go in this file

---

## 📚 Documentation Files

### `README.md`
**For:** Overview and quick reference
**Audience:** Anyone visiting your repo

### `QUICK_START.md`
**For:** Getting started in 5 minutes
**Audience:** New developers

### `SETUP_INSTRUCTIONS.md`
**For:** Detailed setup and configuration
**Audience:** Developers setting up the project

### `DEPLOYMENT_CHECKLIST.md`
**For:** Deploying to production
**Audience:** Ready to deploy

### `COMMANDS.md`
**For:** Common command reference
**Audience:** Daily development

### `FILES_GUIDE.md` (this file!)
**For:** Understanding project structure
**Audience:** Learning the codebase

---

## 🗂️ File Tree

```
healthai/
│
├── 📄 index.html                 ← HTML entry point
├── 📄 package.json               ← Dependencies and scripts
├── 📄 vite.config.ts             ← Vite configuration
├── 📄 .gitignore                 ← Git ignore rules
├── 📄 README.md                  ← Project overview
├── 📄 QUICK_START.md             ← Quick setup guide
├── 📄 SETUP_INSTRUCTIONS.md      ← Detailed guide
├── 📄 DEPLOYMENT_CHECKLIST.md    ← Deploy guide
├── 📄 COMMANDS.md                ← Command reference
├── 📄 FILES_GUIDE.md             ← This file
│
├── 📁 src/
│   ├── 📄 main.tsx               ← React entry point
│   │
│   ├── 📁 app/
│   │   ├── 📄 App.tsx            ← Main app component
│   │   ├── 📄 routes.tsx         ← Router configuration
│   │   │
│   │   ├── 📁 components/
│   │   │   ├── 📄 Layout.tsx     ← Main layout + nav
│   │   │   │
│   │   │   ├── 📁 ui/            ← UI components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   └── ... (more)
│   │   │   │
│   │   │   └── 📁 figma/
│   │   │       └── ImageWithFallback.tsx
│   │   │
│   │   └── 📁 pages/
│   │       ├── 📄 Chat.tsx       ← Chat page
│   │       ├── 📄 Map.tsx        ← Map page
│   │       └── 📄 Dashboard.tsx  ← Dashboard page
│   │
│   └── 📁 styles/
│       ├── 📄 index.css          ← Main CSS
│       ├── 📄 tailwind.css       ← Tailwind imports
│       ├── 📄 theme.css          ← Custom theme
│       └── 📄 fonts.css          ← Font imports
│
└── 📁 node_modules/              ← Dependencies (auto-generated)
```

---

## 🎯 What to Modify vs. What to Leave Alone

### ✅ Safe to Modify

- `src/app/pages/*` - All page components
- `src/app/components/Layout.tsx` - Navigation and branding
- `src/styles/theme.css` - Colors and theme
- `src/styles/fonts.css` - Font imports
- `README.md` - Project documentation

### ⚠️ Modify Carefully

- `src/app/routes.tsx` - When adding new pages
- `package.json` - When adding/removing dependencies
- `vite.config.ts` - When changing build settings

### 🚫 Don't Modify

- `src/app/components/ui/*` - Standard UI components
- `src/app/components/figma/ImageWithFallback.tsx` - System file
- `node_modules/` - Auto-generated
- `dist/` - Build output (auto-generated)

---

## 🔍 Finding What You Need

### To Change App Name
→ `src/app/components/Layout.tsx` (line 16)

### To Add a New Page
1. Create file in `src/app/pages/NewPage.tsx`
2. Add route in `src/app/routes.tsx`
3. Add nav link in `src/app/components/Layout.tsx`

### To Change Colors
→ `src/styles/theme.css`

### To Add Dependencies
```bash
npm install package-name
```
Updates `package.json` automatically

### To Change Port
```bash
npm run dev -- --port 3000
```

---

## 📊 File Count Summary

- **Core App Files:** 7
- **Pages:** 3
- **Components:** 40+ (including UI library)
- **Style Files:** 4
- **Config Files:** 4
- **Documentation:** 6

---

## 🆘 Common Questions

**Q: Where do I start coding?**
A: Start in `src/app/pages/` - modify existing pages or create new ones

**Q: Can I delete the UI components I don't use?**
A: Yes, but keep the ones you're using (Button, Card, Input, etc.)

**Q: How do I know which file has an error?**
A: Check browser console - it shows the file path

**Q: Where are my images stored?**
A: Add images to `public/` folder and reference with `/image.png`

**Q: How do I add a database?**
A: This is frontend-only. For backend, integrate Supabase or Firebase

---

**Now you know where everything is! Happy coding! 🎉**
