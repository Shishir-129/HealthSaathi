# HealthAI - Your Personal Health Assistant 🏥

A modern, responsive health assistant web application built with **Vite + React + TypeScript + Tailwind CSS**.

![React](https://img.shields.io/badge/React-18.3.1-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.3.5-646cff?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.12-38bdf8?logo=tailwindcss)

## ✨ Features

### 💬 AI Chat Assistant
- Interactive chatbot for health-related questions
- Chat history management
- Real-time message updates
- Clean, modern UI

### 🗺️ Healthcare Facility Map
- Find nearby hospitals, clinics, and pharmacies
- View facility details (ratings, hours, contact)
- Interactive map visualization
- Distance calculations

### 📊 Health Dashboard
- Track vital health metrics (heart rate, steps, sleep)
- Beautiful interactive charts (line, bar, pie)
- Activity breakdown and trends
- Health event timeline

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Visit **http://localhost:5173** to see the app!

## 📋 Requirements

- **Node.js** 18.x or higher
- **npm**, **yarn**, or **pnpm**

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI Framework |
| TypeScript | 5.x | Type Safety |
| Vite | 6.3.5 | Build Tool |
| React Router | 7.13.0 | Navigation |
| Tailwind CSS | 4.1.12 | Styling |
| Recharts | 2.15.2 | Data Visualization |
| Lucide React | 0.487.0 | Icons |
| shadcn/ui | - | UI Components |

## 📁 Project Structure

```
healthai/
├── index.html              # Entry HTML
├── src/
│   ├── main.tsx           # React entry point
│   ├── app/
│   │   ├── App.tsx        # Main app component
│   │   ├── routes.tsx     # Router configuration
│   │   ├── components/
│   │   │   ├── Layout.tsx # Main layout + navigation
│   │   │   └── ui/        # Reusable UI components
│   │   └── pages/
│   │       ├── Chat.tsx       # Chat page
│   │       ├── Map.tsx        # Map page
│   │       └── Dashboard.tsx  # Dashboard page
│   └── styles/
│       ├── index.css      # Main CSS
│       ├── tailwind.css   # Tailwind imports
│       └── theme.css      # Custom theme
├── package.json
├── vite.config.ts
├── QUICK_START.md         # Quick setup guide
└── SETUP_INSTRUCTIONS.md  # Detailed documentation
```

## 🎯 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## 🎨 Customization

### Change Branding
Edit `src/app/components/Layout.tsx` to update the app name and logo.

### Modify Theme Colors
Update `src/styles/theme.css` for global color changes.

### Add New Pages
1. Create component in `src/app/pages/`
2. Add route to `src/app/routes.tsx`
3. Add navigation link in `Layout.tsx`

## 📚 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get up and running in 5 minutes
- **[Setup Instructions](SETUP_INSTRUCTIONS.md)** - Detailed setup and configuration

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Upload 'dist' folder to Netlify
```

### GitHub Pages
Update `vite.config.ts`:
```ts
export default defineConfig({
  base: '/your-repo-name/',
  // ...
})
```

## ⚠️ Important Notes

- This is a **demo/prototype** with mock data
- AI responses are **simulated** (not connected to real AI)
- Map is a **placeholder** (integrate Google Maps/Mapbox for production)
- **Always consult real healthcare professionals** for medical advice
- Not intended for collecting PII or sensitive medical data

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Charts powered by [Recharts](https://recharts.org/)

---

**Made with ❤️ for better health management**

---

## 📞 Support

Having issues? Check:
1. [Quick Start Guide](QUICK_START.md)
2. [Setup Instructions](SETUP_INSTRUCTIONS.md)
3. Browser console for errors

---

**Happy Coding! 🎉**
