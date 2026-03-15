# 🚀 Deployment Checklist for HealthAI

Use this checklist to deploy your HealthAI application to production.

## ✅ Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] No console errors in browser
- [ ] All pages load correctly (Chat, Map, Dashboard)
- [ ] Navigation works between all pages
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] All buttons and interactions work

### Performance
- [ ] Run `npm run build` successfully
- [ ] Check bundle size is reasonable
- [ ] Images are optimized
- [ ] No unnecessary console.logs in production code

### Configuration
- [ ] Update app name in `Layout.tsx` (if needed)
- [ ] Update `index.html` title
- [ ] Add favicon/logo
- [ ] Update README with your info
- [ ] Set proper `base` in vite.config.ts (if deploying to subdirectory)

### Security
- [ ] Remove any sensitive data/API keys
- [ ] Add `.env` for environment variables (if needed)
- [ ] Update `.gitignore` to exclude sensitive files

---

## 🌐 Deployment Options

### Option 1: Vercel (Easiest - Recommended)

**Steps:**
1. Create account at [vercel.com](https://vercel.com)
2. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Deploy:
   ```bash
   vercel
   ```
4. Follow prompts and your site will be live!

**Auto-deploy from Git:**
1. Push code to GitHub
2. Import project in Vercel dashboard
3. Auto-deploys on every push

✅ **Checklist:**
- [ ] Vercel account created
- [ ] Project deployed
- [ ] Custom domain configured (optional)
- [ ] Environment variables set (if needed)

---

### Option 2: Netlify

**Steps:**
1. Build the project:
   ```bash
   npm run build
   ```
2. Create account at [netlify.com](https://netlify.com)
3. Drag & drop the `dist` folder to Netlify
4. Your site is live!

**Auto-deploy from Git:**
1. Push code to GitHub
2. "New site from Git" in Netlify
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

✅ **Checklist:**
- [ ] Netlify account created
- [ ] Build completed successfully
- [ ] Site deployed
- [ ] Custom domain configured (optional)

---

### Option 3: GitHub Pages

**Steps:**
1. Update `vite.config.ts`:
   ```ts
   export default defineConfig({
     base: '/your-repo-name/',
     // ... rest of config
   })
   ```

2. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

3. Add to `package.json` scripts:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

5. Enable GitHub Pages in repo settings

✅ **Checklist:**
- [ ] Base path configured in vite.config.ts
- [ ] gh-pages installed
- [ ] Deployed to gh-pages branch
- [ ] GitHub Pages enabled in settings
- [ ] Site accessible at username.github.io/repo-name

---

### Option 4: Railway

**Steps:**
1. Create account at [railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Railway auto-detects Vite and builds
4. Your site is live!

✅ **Checklist:**
- [ ] Railway account created
- [ ] Project connected to GitHub
- [ ] Build successful
- [ ] Site live

---

### Option 5: Render

**Steps:**
1. Create account at [render.com](https://render.com)
2. New Static Site
3. Connect GitHub repo
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

✅ **Checklist:**
- [ ] Render account created
- [ ] Static site created
- [ ] Build successful
- [ ] Site live

---

## 🔧 Build Troubleshooting

### Build fails with TypeScript errors
```bash
# Check for errors
npm run build

# Fix TypeScript issues in reported files
# Add '// @ts-ignore' above problematic lines if needed (not recommended)
```

### Build succeeds but site is blank
```bash
# Check browser console for errors
# Likely issue: incorrect base path in vite.config.ts
# For root domain deployment, use: base: '/'
# For subdirectory: base: '/subdirectory/'
```

### Routes don't work after deployment
Add `_redirects` file in `public/` folder:
```
/*    /index.html   200
```

Or for Vercel, create `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## 📊 Post-Deployment Checks

- [ ] Homepage loads
- [ ] All three pages accessible (Chat, Map, Dashboard)
- [ ] Navigation works
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Fast loading times
- [ ] Images load correctly
- [ ] Charts render properly

---

## 🎯 Optional Enhancements

### Analytics
- [ ] Add Google Analytics
- [ ] Add Vercel Analytics
- [ ] Track user interactions

### Performance
- [ ] Enable compression
- [ ] Add service worker for offline support
- [ ] Optimize images further
- [ ] Enable CDN

### SEO
- [ ] Add meta tags in index.html
- [ ] Add Open Graph tags
- [ ] Add sitemap.xml
- [ ] Add robots.txt

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Monitor uptime
- [ ] Set up alerts

---

## 🔗 Useful Resources

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Router Deployment](https://reactrouter.com/en/main/start/tutorial#deploying)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)

---

## 🆘 Common Issues

### Issue: Routes return 404
**Solution:** Configure your host to redirect all routes to index.html

### Issue: Environment variables not working
**Solution:** Add them in your hosting platform's dashboard

### Issue: Build is too large
**Solution:** Check for unnecessary dependencies, optimize images

### Issue: Slow loading
**Solution:** Enable caching, use CDN, optimize bundle size

---

**Good luck with your deployment! 🎉**

Once deployed, share your link and let users enjoy HealthAI!
