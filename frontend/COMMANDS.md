# 📝 Useful Commands for HealthAI

Quick reference for common commands you'll need.

## 🚀 Development

### Start Development Server
```bash
npm run dev
```
Opens at `http://localhost:5173`

### Build for Production
```bash
npm run build
```
Creates optimized files in `dist/` folder

### Preview Production Build
```bash
npm run preview
```
Test your production build locally

---

## 📦 Package Management

### Install All Dependencies
```bash
npm install
```

### Install a New Package
```bash
npm install package-name
```

### Install Dev Dependency
```bash
npm install --save-dev package-name
```

### Update All Packages
```bash
npm update
```

### Check Outdated Packages
```bash
npm outdated
```

### Remove a Package
```bash
npm uninstall package-name
```

---

## 🧹 Cleanup

### Clear Node Modules and Reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

### Clear Vite Cache
```bash
rm -rf node_modules/.vite
npm run dev
```

### Clean Build Folder
```bash
rm -rf dist
npm run build
```

---

## 🔍 Debugging

### Check for TypeScript Errors
```bash
npx tsc --noEmit
```

### Check Package Version
```bash
npm list package-name
```

### View All Installed Packages
```bash
npm list --depth=0
```

---

## 🌐 Git Commands (if using version control)

### Initialize Git
```bash
git init
```

### Add All Files
```bash
git add .
```

### Commit Changes
```bash
git commit -m "Your message here"
```

### Push to GitHub
```bash
git remote add origin https://github.com/username/repo.git
git branch -M main
git push -u origin main
```

### Create New Branch
```bash
git checkout -b feature-name
```

### Merge Branch
```bash
git checkout main
git merge feature-name
```

---

## 🚢 Deployment

### Deploy to Vercel
```bash
# Install Vercel CLI globally (one time)
npm install -g vercel

# Deploy
vercel
```

### Deploy to Netlify (manual)
```bash
# Build first
npm run build

# Then drag 'dist' folder to Netlify website
```

### Deploy to GitHub Pages
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add deploy script to package.json first, then:
npm run deploy
```

---

## 🛠️ Useful Shortcuts

### Kill Process on Port (if port is in use)

**Windows:**
```bash
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -ti:5173 | xargs kill
```

### Open in VS Code
```bash
code .
```

### Open in Browser
```bash
# Mac
open http://localhost:5173

# Linux
xdg-open http://localhost:5173

# Windows
start http://localhost:5173
```

---

## 📊 Project Analysis

### Check Bundle Size
```bash
npm run build
# Check the size in the terminal output
```

### Analyze Dependencies
```bash
npx vite-bundle-visualizer
```

---

## 🧪 Testing (if you add tests later)

### Run Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

---

## 💡 Quick Tips

### Run Multiple Commands
```bash
# Install and start dev server
npm install && npm run dev

# Clean, install, and build
rm -rf node_modules && npm install && npm run build
```

### Create New Component (example)
```bash
# Create new page
touch src/app/pages/NewPage.tsx

# Create new component
touch src/app/components/NewComponent.tsx
```

---

## 🆘 Troubleshooting Commands

### Port Already in Use
```bash
# Use different port
npm run dev -- --port 3000
```

### Force Clear Everything
```bash
rm -rf node_modules package-lock.json dist .vite
npm install
```

### Check Node and npm Versions
```bash
node --version
npm --version
```

### Update npm
```bash
npm install -g npm@latest
```

---

## 📚 Documentation Links

- **Vite Docs:** https://vitejs.dev
- **React Docs:** https://react.dev
- **React Router:** https://reactrouter.com
- **Tailwind CSS:** https://tailwindcss.com
- **Recharts:** https://recharts.org

---

**Save this file for quick reference! 📌**
