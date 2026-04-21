# 🏥 MedTwin+ — Smart Healthcare Access System v2.0

A production-grade, full-stack healthcare platform that enables patients to find hospitals, check symptoms with AI, book appointments with smart doctor routing, and access verified patient reviews.

## ✨ Key Features

- 🗺️ **OpenStreetMap (Leaflet.js)** — Interactive maps, zero paid APIs
- 🤖 **Groq AI Symptom Checker** — AI-powered medical guidance
- 🧑‍⚕️ **Smart Doctor Routing** — Senior → Practitioner fallback, never rejects
- 🚨 **Emergency Hospital Finder** — One-click nearest hospitals with map
- ⭐ **Verified Reviews** — Only completed appointment patients can review
- 💬 **Patient Feedback Hub** — Browse all feedback before choosing a hospital
- 📱 **Mobile Responsive** — Clean medical dashboard design

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Tailwind CSS v4 |
| Backend | Node.js + Express.js |
| Database | Firebase Firestore (with in-memory demo fallback) |
| Maps | OpenStreetMap + Leaflet.js |
| AI | Groq AI (LLaMA 3.3 70B) |
| No Paid APIs | ✅ Zero Google/paid API dependencies |

## 🚀 Quick Start

### 1. Start Backend
```bash
cd server
npm install
node server.js
```
Backend runs at: http://localhost:5000

### 2. Start Frontend
```bash
cd client
npm install
npm run dev
```
Frontend runs at: http://localhost:3000

### 3. (Optional) Add Groq AI Key
Get a free API key from https://console.groq.com and add to `server/.env`:
```
GROQ_API_KEY=your_key_here
```

## 📁 Project Structure

```
MEDAI/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI, Layout, Map components
│   │   ├── pages/          # 7 pages (Home, Hospitals, AI Check, etc.)
│   │   ├── services/       # API client (Axios)
│   │   ├── hooks/          # useGeolocation
│   │   └── App.jsx         # Router
│   └── package.json
├── server/                 # Node.js Backend
│   ├── routes/             # hospitals, doctors, appointments, reviews, ai
│   ├── services/           # placesService, doctorAssignment, groqAI
│   ├── config/             # Firebase config
│   └── server.js           # Express app
└── README.md
```

## 🏆 Hackathon-Winning Features

1. **Zero Cost** — No paid APIs (OpenStreetMap + Groq free tier)
2. **AI-Powered** — Symptom analysis with hospital recommendations
3. **Smart Routing** — Senior → Practitioner → Scheduled (never rejects)
4. **Real-time Updates** — Firebase Firestore listeners
5. **Trust System** — Verified-only patient reviews
6. **Emergency Mode** — Instant hospital finder with map
