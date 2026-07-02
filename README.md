# Vibora — Share Your World
### A Social Platform Tailored for Bangladesh

Vibora is a localized community portal and social network designed specifically to solve local problems. It bridges the gap between social media connections and everyday utilities by combining features from Facebook groups, Reddit discussions, LinkedIn networking, and local classified boards.

---

## 🚀 Core Features

- 🔑 **Authentication & Profiles**: Secure JWT-based registration and login, Google Sign-In simulation, and customizable profile pages featuring university details, district selections, biography, and skill tag trackers.
- 📱 **Interactive Social Feed**: Create, read, like, comment, and share publications. Supports text posts and base64-encoded image attachments for easy local rendering.
- 🎓 **Tuition Marketplace**: Local board for teachers to advertise profiles and parents/students to request home/online tutors. Filterable by subject and district.
- 🩸 **Blood Donor Finder**: Search active blood donors across Bangladesh by blood group and district. Features instant contact call shortcuts and a registry dashboard to register as an active donor.
- 💼 **Job & Internship Board**: Browse local internship opportunities, remote work, and part-time careers at Bangladeshi startups. Features a "Quick Apply" trigger that submits profile details instantly.
- 📢 **Local Notice Board**: Stay up-to-date with local announcements, community events, and lost & found requests.
- 💬 **Real-Time Messaging**: Interactive chat channels powered by native WebSocket connections, supporting user conversation lists and instant message delivery.

---

## 🛠️ Tech Stack

**Frontend:**
- React (Vite SPA)
- React Router DOM
- Tailwind CSS v4 (Modern compile engine)
- Lucide React (Iconography)

**Backend:**
- Node.js & Express
- Native WebSockets (`ws`)
- JWT (JSON Web Tokens) & BCryptJS (Password hashing)

**Database:**
- **Zero-Config Hybrid Adapter**: Defaults to a local JSON file database (`backend/data/db.json`) for immediate local execution, with automatic fallback switch to a MongoDB Atlas cluster if `MONGO_URI` is provided in env settings.

---

## ⚙️ Project Structure

```text
Website-Project/
├── backend/
│   ├── data/
│   │   └── db.json          # Local file database fallback
│   ├── src/
│   │   ├── config/          # Hybrid database adapter
│   │   ├── middleware/      # JWT auth middlewares
│   │   ├── models/          # Schema configurations
│   │   ├── routes/          # API endpoint routes
│   │   ├── utils/           # WebSocket connection manager
│   │   └── server.js        # Express main entry point
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/      # Glassmorphic Navbar & headers
    │   ├── context/         # Auth & Socket state providers
    │   ├── pages/           # Platform modules (Feed, Tuition, Blood, Jobs, Notices, Chat, Profile)
    │   ├── App.jsx          # Route manager
    │   └── index.css        # Tailwind imports
    ├── package.json
    └── vite.config.js
```

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- NPM

### 1. Setup Backend
1. Go to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file using the template:
   ```bash
   cp .env.example .env
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will boot on `http://localhost:5000`.*

### 2. Setup Frontend
1. Go to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will boot on `http://localhost:5173/`.*

---

## 📄 License
This project is open-source and available under the MIT License.
