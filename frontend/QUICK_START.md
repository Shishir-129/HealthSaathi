# 🚀 Quick Start Guide for HealthAI

## Step-by-Step Setup

### 1️⃣ Clone or Copy the Project
```bash
# If using git
git clone <your-repo-url>
cd <project-folder>
```

### 2️⃣ Install Dependencies
```bash
npm install
```
**This will install all required packages including:**
- React & React DOM
- React Router (for navigation)
- Recharts (for charts)
- Lucide React (for icons)
- Tailwind CSS (for styling)
- All UI components

### 3️⃣ Run the Development Server
```bash
npm run dev
```

**You should see:**
```
VITE v6.3.5  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### 4️⃣ Open Your Browser
Navigate to: **http://localhost:5173**

---

## 📁 What You'll See

The app has **3 main pages** accessible from the left sidebar:

### 1. **Chat Page** (Default - `/chat`)
- Talk to the AI health assistant
- View chat history
- Start new conversations

### 2. **Map Page** (`/map`)
- See nearby healthcare facilities
- View hospitals, clinics, pharmacies
- Get directions and contact info

### 3. **Dashboard Page** (`/dashboard`)
- View health statistics
- See charts for heart rate, sleep, activity
- Track health events

---

## 🛠️ Build for Production

When ready to deploy:

```bash
npm run build
```

This creates a `dist/` folder with optimized files ready for deployment.

To preview the production build locally:

```bash
npm run preview
```

---

## 📂 Key Files to Know

| File | Purpose |
|------|---------|
| `index.html` | HTML entry point |
| `src/main.tsx` | React entry point |
| `src/app/App.tsx` | Main app with router |
| `src/app/routes.tsx` | Route configuration |
| `src/app/components/Layout.tsx` | Navigation sidebar |
| `src/app/pages/Chat.tsx` | Chat page |
| `src/app/pages/Map.tsx` | Map page |
| `src/app/pages/Dashboard.tsx` | Dashboard page |

---

## 🎨 Customization Tips

### Change App Name
Edit `src/app/components/Layout.tsx` line 16:
```tsx
<h1 className="font-bold text-xl text-gray-800">HealthAI</h1>
```

### Change Colors
The app uses a blue-green gradient theme. To modify:
- Edit `src/styles/theme.css` for global colors
- Or change Tailwind classes in components

### Add New Pages
1. Create new file in `src/app/pages/YourPage.tsx`
2. Add route in `src/app/routes.tsx`
3. Add navigation link in `src/app/components/Layout.tsx`

---

## ❓ Troubleshooting

### "Cannot find module" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 5173 already in use
Vite will automatically use the next available port (5174, 5175, etc.)

### Charts not showing
Make sure `recharts` is installed:
```bash
npm install recharts
```

### Icons not showing
Make sure `lucide-react` is installed:
```bash
npm install lucide-react
```

---

## 📦 Package Managers

This project works with any package manager:

**npm:**
```bash
npm install
npm run dev
```

**yarn:**
```bash
yarn install
yarn dev
```

**pnpm:**
```bash
pnpm install
pnpm dev
```

---

## ✅ Verification Checklist

- [ ] Node.js installed (v18+)
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server running (`npm run dev`)
- [ ] Browser open at `http://localhost:5173`
- [ ] Can navigate between Chat, Map, Dashboard pages
- [ ] Can send messages in Chat
- [ ] Can see charts in Dashboard

---

## 🎯 Next Steps

- Integrate real AI API for chat responses
- Add Google Maps or Mapbox for real maps
- Connect to backend for data persistence
- Add user authentication
- Deploy to Vercel, Netlify, or your hosting

---

## 💡 Need Help?

Check `SETUP_INSTRUCTIONS.md` for detailed documentation.

**Common Issues:**
1. **Blank screen** → Check browser console for errors
2. **Styles not loading** → Verify Tailwind CSS is set up
3. **Routing not working** → Check React Router is installed

---

**That's it! You're ready to go! 🎉**
