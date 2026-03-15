# 👋 START HERE - Your HealthAI Project

Welcome! This is your complete guide to get the HealthAI website running.

---

## 🚀 In 3 Simple Steps

### Step 1: Install Everything
Open your terminal in this project folder and run:
```bash
npm install
```
⏱️ This takes 1-2 minutes. Grab a coffee! ☕

### Step 2: Start the App
```bash
npm run dev
```
✅ You should see: `Local: http://localhost:5173/`

### Step 3: Open in Browser
Go to: **http://localhost:5173**

🎉 **That's it! Your app is running!**

---

## 🎯 What You'll See

Your browser will show the **HealthAI** website with:

1. **Left Sidebar** - Navigation menu
2. **Chat Page** (default) - AI health assistant
3. **Map Page** - Nearby healthcare facilities  
4. **Dashboard Page** - Health statistics

---

## 🎮 Try These Things

### ✅ Click around the navigation
- Click "Chat" in sidebar
- Click "Map" in sidebar
- Click "Dashboard" in sidebar

### ✅ Test the chat
- Type a message in the chat box
- Click send or press Enter
- See the AI respond!

### ✅ Check the dashboard
- See charts and health metrics
- Scroll to see all widgets

---

## 📚 What to Read Next

### **Just want to use it?**
You're done! Keep the dev server running and enjoy.

### **Want to understand the code?**
Read: `FILES_GUIDE.md` - explains every file

### **Ready to customize?**
Read: `QUICK_START.md` - customization tips

### **Want to deploy online?**
Read: `DEPLOYMENT_CHECKLIST.md` - deploy to Vercel, Netlify, etc.

### **Need commands?**
Read: `COMMANDS.md` - all useful commands

---

## 🛠️ Common Issues

### ❌ "npm: command not found"
**Fix:** Install Node.js from https://nodejs.org

### ❌ "Port 5173 is already in use"
**Fix:** Vite will automatically use port 5174, 5175, etc.
Or close the other app using port 5173.

### ❌ Nothing happens after `npm install`
**Fix:** Make sure you're in the project folder:
```bash
cd path/to/healthai
npm install
```

### ❌ Blank white screen
**Fix:** Check browser console (F12) for errors.
Make sure `npm run dev` is running.

---

## 📁 Project Structure (Simple)

```
healthai/
├── src/
│   ├── app/
│   │   ├── pages/           ← Your 3 pages (Chat, Map, Dashboard)
│   │   ├── components/      ← Reusable components
│   │   ├── App.tsx          ← Main app
│   │   └── routes.tsx       ← Page routing
│   ├── styles/              ← CSS files
│   └── main.tsx             ← Entry point
├── index.html               ← HTML file
├── package.json             ← Dependencies
└── vite.config.ts           ← Build config
```

---

## 🎨 Quick Customizations

### Change the App Name
1. Open `src/app/components/Layout.tsx`
2. Find line 16: `<h1>HealthAI</h1>`
3. Change "HealthAI" to your name
4. Save and refresh browser

### Change Colors
1. Open `src/styles/theme.css`
2. Modify the color values
3. Save and see changes instantly

### Add Your Logo
1. Add image to `public/` folder
2. Update `src/app/components/Layout.tsx`
3. Replace the logo div with your image

---

## 🌐 Going Live

When you're ready to share your website:

### Easiest Way: Vercel (Free)
1. Create account at https://vercel.com
2. Connect your GitHub repo (or upload files)
3. Click deploy
4. Get a live link!

**Full guide:** See `DEPLOYMENT_CHECKLIST.md`

---

## 💡 Pro Tips

### Hot Reload
Your changes automatically refresh the browser. Just save and watch!

### Multiple Terminals
Keep `npm run dev` running in one terminal.
Open another terminal for other commands.

### Browser Dev Tools
Press F12 to see console, network, and debug tools.

### Save Often
Use Ctrl+S (Windows) or Cmd+S (Mac) to save files.

---

## 🆘 Get Help

### Read Documentation
- `QUICK_START.md` - 5-minute setup
- `FILES_GUIDE.md` - Understand all files
- `SETUP_INSTRUCTIONS.md` - Detailed guide
- `COMMANDS.md` - Command reference

### Check Browser Console
Press F12 → Console tab to see errors

### Check Terminal
Look for error messages where you ran `npm run dev`

---

## ✅ Success Checklist

- [ ] Node.js installed
- [ ] Ran `npm install` successfully
- [ ] Ran `npm run dev` successfully  
- [ ] Opened http://localhost:5173 in browser
- [ ] Can see the HealthAI website
- [ ] Can click between Chat, Map, Dashboard pages
- [ ] Can send messages in Chat
- [ ] Can see charts in Dashboard

**All checked? You're ready to go! 🚀**

---

## 🎯 Next Steps

1. **Explore the code** - Open files and see how it works
2. **Make small changes** - Change some text, colors, etc.
3. **Add features** - Create new pages or components
4. **Deploy** - Share your site with the world!

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Start development | `npm run dev` |
| Build for production | `npm run build` |
| Stop dev server | `Ctrl+C` (in terminal) |

---

**Have fun building! 🎉**

If you get stuck, all the answers are in the documentation files. Start with `QUICK_START.md` or `FILES_GUIDE.md`.

**Remember:** Save often, refresh browser, check console for errors!

---

*Made with ❤️ - Happy Coding!*
