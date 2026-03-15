# HealthAI - Vite React Setup Instructions

This is a health assistant AI website built with **Vite + React + TypeScript + Tailwind CSS**.

## 📋 Prerequisites

- Node.js (v18 or higher recommended)
- npm, yarn, or pnpm package manager

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The app will be available at `http://localhost:5173` (or another port if 5173 is busy).

### 3. Build for Production

```bash
npm run build
# or
yarn build
# or
pnpm build
```

## 📁 Project Structure

```
├── index.html                  # HTML entry point
├── package.json                # Dependencies
├── vite.config.ts             # Vite configuration
├── src/
│   ├── main.tsx               # React entry point
│   ├── app/
│   │   ├── App.tsx            # Main App component with RouterProvider
│   │   ├── routes.tsx         # React Router configuration
│   │   ├── components/
│   │   │   ├── Layout.tsx     # Main layout with sidebar navigation
│   │   │   ├── ui/            # Reusable UI components (shadcn/ui)
│   │   │   └── figma/         # Figma-related components
│   │   └── pages/
│   │       ├── Chat.tsx       # Chat with AI page
│   │       ├── Map.tsx        # Healthcare facilities map
│   │       └── Dashboard.tsx  # Health stats dashboard
│   └── styles/
│       ├── index.css          # Main CSS entry
│       ├── tailwind.css       # Tailwind imports
│       ├── theme.css          # Theme variables
│       └── fonts.css          # Font imports
```

## 🎯 Features

### 1. **Chat Page** (`/chat`)
- AI chatbot interface for health questions
- Chat history sidebar
- New chat functionality
- Real-time message updates

### 2. **Map Page** (`/map`)
- Interactive map view
- Nearby healthcare facilities list
- Facility details (address, phone, hours, ratings)
- Search functionality

### 3. **Dashboard Page** (`/dashboard`)
- Health metrics overview (heart rate, steps, sleep, activity)
- Interactive charts (line, bar, pie)
- Recent health events timeline
- Trend indicators

## 🛠️ Technology Stack

- **React 18.3.1** - UI library
- **TypeScript** - Type safety
- **Vite 6.3.5** - Build tool
- **React Router 7.13.0** - Routing
- **Tailwind CSS 4.1.12** - Styling
- **Recharts 2.15.2** - Charts and graphs
- **Lucide React 0.487.0** - Icons
- **shadcn/ui** - UI components

## 📦 Required Dependencies

All dependencies are already listed in `package.json`. Key packages:

```json
{
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "react-router": "7.13.0",
  "recharts": "2.15.2",
  "lucide-react": "0.487.0",
  "tailwindcss": "4.1.12"
}
```

## 🎨 Customization

### Changing Colors
Edit `/src/styles/theme.css` to modify the color scheme.

### Adding New Pages
1. Create a new component in `/src/app/pages/`
2. Add route in `/src/app/routes.tsx`
3. Add navigation link in `/src/app/components/Layout.tsx`

### Modifying Navigation
Edit `/src/app/components/Layout.tsx` to add/remove navigation items.

## 🔧 Troubleshooting

### Port Already in Use
If port 5173 is busy, Vite will automatically use the next available port.

### Module Not Found Errors
Run `npm install` to ensure all dependencies are installed.

### Build Errors
Clear cache and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📝 Notes

- This is a frontend-only application with mock data
- AI responses are simulated (not connected to real AI)
- Map is a placeholder (integrate real map API like Google Maps or Mapbox for production)
- Always consult real healthcare professionals for medical advice

## 🚢 Deployment

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Upload the 'dist' folder to Netlify
```

### Deploy to GitHub Pages
Add to `vite.config.ts`:
```ts
export default defineConfig({
  base: '/your-repo-name/',
  // ... rest of config
})
```

Then:
```bash
npm run build
# Deploy the 'dist' folder
```

## 📄 License

MIT License - feel free to use this project however you'd like!
