```
 ██╗  ██╗███████╗ █████╗ ██╗  ████████╗██╗  ██╗███████╗ █████╗ ████████╗██╗  ██╗██╗
 ██║  ██║██╔════╝██╔══██╗██║  ╚══██╔══╝██║  ██║██╔════╝██╔══██╗╚══██╔══╝██║  ██║██║
 ███████║█████╗  ███████║██║     ██║   ███████║███████╗███████║   ██║   ███████║██║
 ██╔══██║██╔══╝  ██╔══██║██║     ██║   ██╔══██║╚════██║██╔══██║   ██║   ██╔══██║██║
 ██║  ██║███████╗██║  ██║███████╗██║   ██║  ██║███████║██║  ██║   ██║   ██║  ██║██║
 ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝
```

# HealthSathi 🏥 - Your AI Health Companion for Rural Nepal

<div align="center">

**हेल्थसाथी** — *Your Trusted Health Guide*

[![Django](https://img.shields.io/badge/Django-4.2-%23092E20?style=flat-square&logo=django)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Groq](https://img.shields.io/badge/Groq-LLaMA%203.3-FF0000?style=flat-square)](https://groq.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776ab?style=flat-square&logo=python)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**Built for the AI Hackathon 2026** 🚀  
*March 15-16 @ Embark College Pulchowk | The Startup Network*


</div>

---

## 🎯 Problem Statement

> **Millions of people in rural Nepal die from treatable conditions every year.**

In remote areas of Nepal, people often don't know how serious their symptoms are or where to go for help. Without immediate access to doctors, medical triage becomes impossible. This delay can turn minor health issues into medical emergencies.

**Key Statistics:**
- 🏥 Only 1 hospital per 200+ km² in rural areas
- 📱 Mobile penetration: 86% in Nepal
- 💔 Preventable deaths due to lack of early diagnosis
- 🌍 Language barrier: 44 languages spoken in Nepal

---

## ✨ Solution

**HealthSathi** is an AI-powered medical triage web application that provides **instant symptom assessment** in **both Nepali and English**. Users describe their symptoms to our AI, receive a risk level (HIGH/MEDIUM/LOW), and get directions to the nearest health facility.

**Key Benefits:**
- ⚡ **Instant Access** — AI-powered triage 24/7 in 30 seconds
- 🗣️ **Voice Input** — Speak your symptoms in Nepali or English
- 📍 **Real-Time Maps** — Find nearest hospitals, clinics, pharmacies
- 🌐 **Bilingual** — Full Nepali-English support
- 🔐 **Privacy First** — Encrypted user data, local caching
- 📊 **Health Dashboard** — Track your medical history
- 📵 **Offline Ready** — Hardcoded health posts for connectivity issues

---

## 🚀 Features

| Feature | Description | Status |
|---------|-------------|--------|
| 🩺 **AI Symptom Triage** | Describe symptoms, get instant risk assessment (HIGH/MEDIUM/LOW) | ✅ |
| 🗣️ **Voice Input** | Speak your symptoms using microphone (Nepali & English) | ✅ |
| 🌐 **Multilingual Support** | Full Nepali and English with auto-detection | ✅ |
| 📍 **Nearest Health Facilities** | Shows nearby hospitals, clinics on interactive map | ✅ |
| 👤 **User Authentication** | Register, login, logout with secure token auth | ✅ |
| 💾 **Chat History** | All consultations saved per user profile | ✅ |
| 📋 **User Profile** | Manage name, email, phone, blood group | ✅ |
| 📊 **Dashboard** | Real-time stats: sessions, risk distribution, top districts | ✅ |
| ⚡ **Semantic Caching** | Similar symptoms return cached results instantly | ✅ |
| 🔄 **Quick Symptoms** | Preset button for common conditions | ✅ |
| 🌍 **Baato Maps Integration** | Nepal-specific mapping API | ✅ |
| 📱 **Mobile-First Design** | Responsive on all devices | ✅ |

---

## 🛠️ Tech Stack

### Backend
| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | Django REST Framework | 4.2 |
| **Database** | PostgreSQL | 15+ |
| **Auth** | Django Token Authentication | Built-in |
| **Primary AI** |azure_gpt_5_4| Latest |
| **Then  AI** | Groq (LLaMA 3.3 70B) | Latest |
| **Fallback AI** | Google Gemini 2.0 Flash | Latest |
| **Maps API** | Baato Maps | v1 |
| **Caching** | Redis / Django Cache | Semantic |
| **Environment** | Python | 3.10+ |

### Frontend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | React 18+ | UI Components |
| **Build Tool** | Vite | Fast bundling |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Routing** | React Router DOM | Navigation |
| **HTTP Client** | Axios | API calls |
| **Maps** | Leaflet.js | Interactive maps |
| **Voice** | Web Speech API | Voice input/output |
| **State** | React Context API | State management |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **Database** | PostgreSQL with pgAdmin |
| **Cache** | Semantic caching system |
| **API Gateway** | Django REST Framework |
| **Maps Service** | Baato (Nepal-specific) |
| **Hosting** | (Configurable) |

---
## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Python 3.10+** ([Download](https://www.python.org/downloads/))
- **Node.js 16+** ([Download](https://nodejs.org/))
- **PostgreSQL 12+** ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))
- **API Keys** for:
  - azure_gpt_5_4(Primary AI)
  - Groq API ( Then  AI)
  - Google Gemini API (Fallback)
  - Baato Maps API

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/prashant7738/HealthSathi.git
   cd healthsathi/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and database credentials
   ```

5. **Run database migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser (optional, for admin panel)**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start development server**
   ```bash
   python manage.py runserver
   ```
   Backend runs on `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Update with your backend API URL
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

### 🎉 You're Ready!

Visit `http://localhost:5173` in your browser to use HealthSathi!

---

## 🔑 Environment Variables

### Backend (.env)

| Variable | Example | Description |
|----------|---------|-------------|
| `AZURE_OPENAI_API_KEY` | `sk_...` | Azure OpenAI API key (primary) |
| `GROQ_API_KEY` | `gsk_...` | Groq API key for LLaMA AI |
| `GEMINI_API_KEY` | `AIzaSy...` | Google Gemini API key (fallback) |
| `BAATO_API_KEY` | `ba_...` | Baato Maps API key |
| `DB_NAME` | `healthsathi` | PostgreSQL database name |
| `DB_USER` | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | `password123` | PostgreSQL password |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `SECRET_KEY` | (auto-generated) | Django secret key |
| `DEBUG` | `False` | Debug mode (False in production) |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Allowed hosts |

### Frontend (.env)

| Variable | Example | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000/api` | Backend API base URL |
| `VITE_APP_NAME` | `HealthSathi` | Application name |

---

## 📡 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| `POST` | `/api/auth/register/` | Register new user | ❌ |
| `POST` | `/api/auth/login/` | User login (returns token) | ❌ |
| `POST` | `/api/auth/logout/` | Logout user | ✅ |

### Triage Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| `POST` | `/api/triage/` | Submit symptoms for AI analysis | ✅ |
| `GET` | `/api/triage/history/` | Get user's past triage sessions | ✅ |

### Dashboard & Stats Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| `GET` | `/api/stats/` | Get user dashboard stats | ✅ |
| `GET` | `/api/profile/` | Get user profile | ✅ |
| `PUT` | `/api/profile/` | Update user profile | ✅ |

## 📁 Project Structure

```
HealthSathi/
│
├── backend/                          # Django REST API
│   ├── nepalcare/                    # Main Django project
│   │   ├── settings.py               # Django configuration
│   │   ├── urls.py                   # URL routing
│   │   └── wsgi.py                   # WSGI server
│   │
│   ├── triage/                       # Main application
│   │   ├── models.py                 # Database models (User, Session, etc.)
│   │   ├── views.py                  # API views
│   │   ├── serializers.py            # Request/response serializers
│   │   ├── urls.py                   # App-specific routing
│   │   │
│   │   ├── ai_client.py              # Groq & Gemini AI integration
│   │   ├── chromadb.py               # Semantic caching with ChromaDB
│   │   ├── baato.py                  # Baato Maps API integration
│   │   ├── supabase_client.py        # Supabase integration
│   │   ├── database_client.py        # Database operations
│   │   ├── user_profile.py           # User profile management
│   │   │           
│   │   │
│   │   ├── migrations/               # Database migrations
│   │   └── admin.py                  # Django admin config
│   │
│   ├── chromadb_data/                # Vector database storage
│   │
│   ├── manage.py                     # Django management script
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example                  # Environment template
│
├── frontend/                         # React + Vite application
│   ├── src/
│   │   ├── pages/                    # Route pages
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ChatPage.jsx          # Main triage interface
│   │   │   ├── DashboardPage.jsx     # User stats
│   │   │   ├── ProfilePage.jsx       # User settings
│   │   │   ├── MapPage.jsx           # Health facilities map
│   │   │   └── GuidePage.jsx         # User guide
│   │   │
│   │   ├── components/               # Reusable components
│   │   │   ├── ChatWindow.jsx        # Chat interface
│   │   │   ├── HealthMap.jsx         # Leaflet map
│   │   │   ├── VoiceButton.jsx       # Voice input
│   │   │   ├── SpeakButton.jsx       # Text-to-speech
│   │   │   ├── RiskCard.jsx          # Risk display
│   │   │   └── LanguageToggle.jsx    # Language switch
│   │   │
│   │   ├── context/                  # State management
│   │   │   └── AppContext.jsx
│   │   │
│   │   ├── services/                 # API & utility services
│   │   │   ├── api.js                # Axios instance
│   │   │   ├── triageService.js      # Triage API calls
│   │   │   ├── locationService.js    # Geolocation & maps
│   │   │   ├── textToSpeechService.js
│   │   │   └── presentationLogger.js
│   │   │
│   │   ├── i18n/                     # Internationalization
│   │   │   └── translations.js       # Nepali & English
│   │   │
│   │   ├── data/                     # Static data
│   │   │   └── healthPosts.js        # Offline fallback
│   │   │
│   │   ├── App.jsx                   # Root component
│   │   ├── main.jsx                  # Entry point
│   │   └── index.css                 # Global styles
│   │
│   ├── index.html                    # HTML template
│   ├── package.json                  # npm dependencies
│   ├── vite.config.js                # Vite configuration
│   ├── tailwind.config.js            # Tailwind CSS setup
│   ├── postcss.config.js             # PostCSS configuration
│   └── .env.example                  # Environment template
│
│
└── README.md                         # Project documentation
```

---


## 🏥 Health Risk Levels

| Level | Range | Definition | Action |
|-------|-------|-----------|--------|
| 🔴 **HIGH** | 8-10 | Life-threatening, urgent care needed | Go to Hospital immediately |
| 🟠 **MEDIUM** | 4-7 | Serious but not immediately life-threatening | Visit clinic today |
| 🟢 **LOW** | 0-3 | Minor symptoms, manageable at home | Pharmacy/Home care |

---

## 🔐 Security & Privacy

- ✅ **Token Authentication** — Secure API access via Django REST tokens
- ✅ **Password Hashing** — SHA-256 with Django's default hasher
- ✅ **CORS Protection** — Configured for frontend origin only
- ✅ **User Isolation** — Data only accessible to authenticated user
- ✅ **HTTPS Ready** — Production setup with SSL/TLS
- ✅ **Rate Limiting** — (Configurable) prevent API abuse
- ✅ **Local Caching** — Sensitive data cached locally when possible
- ⚠️ **Beta Notice** — Not for real medical diagnosis. Always consult doctors!

---

## 🤝 Team

**Built for AI Hackathon 2026**

| Role | Name | GitHub |
|------|------|--------|
| **Full Stack** | Team Paila | [GitHub](https://github.com/prashant7738/HealthSathi) |

---

## 🎉 Hackathon Details

- **Event:** AI Hackathon 2026
- **Dates:** March 15-16, 2026
- **Venue:** Embark College Pulchowk, Kathmandu, Nepal
- **Organized by:** The Startup Network
- **Category:** AI for Social Good / Healthcare
- **Prize:** (TBD)

## 📞 Support

- 📧 Email: bhattsushil567@gmail.com
- github: [GitHub](https://github.com/prashant7738)
          
