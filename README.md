# 🩸 Red Pulse — Real-Time Blood Bank Management System

> **"Every second counts. Red Pulse connects blood to those who need it — instantly."**

![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.10%2B-blue)
![Flask](https://img.shields.io/badge/flask-2.3%2B-green)
![SQLite](https://img.shields.io/badge/database-SQLite-orange)

---

## 📌 Overview

**Red Pulse** is a full-stack, human-centered, real-time blood bank management system built with Python (Flask), SQLite, WebSockets (Socket.IO), and an interactive Leaflet.js map. It features two signature AI-powered modules:

- 🔮 **AI Blood Demand Forecasting** — Predicts blood demand by type for the next 7 days using a Random Forest ML model.
- 🆘 **SOS Emergency Alert System** — Instantly broadcasts critical blood requests to nearby, compatible donors via WebSocket and email.

---

## 🎯 Key Features

| Feature | Description |
|---|---|
| 📊 Live Admin Dashboard | Real-time inventory, active requests, and map |
| 🗺️ Live Map | Donor and blood bank pins with color-coded stock levels |
| 🔮 AI Demand Forecast | 7-day prediction chart per blood type |
| 🆘 SOS Emergency System | Multi-channel donor broadcast within 5 seconds |
| 👤 Donor Registration | Geolocation-enabled, auto-eligibility tracking |
| 💉 Blood Request Form | Urgency-aware form with nearest bank finder |
| 📍 Donor Profile | Donation history, eligibility bar, gamification badges |
| ⚡ WebSockets | Real-time updates: inventory, new requests, SOS alerts |

---

## 🗄️ Database Schema

```
donors          — id, name, blood_type, phone, email, city, lat, lng, last_donated, is_available, health_status
blood_banks     — id, name, address, city, lat, lng, contact_number, operating_hours, is_active
blood_inventory — id, blood_type, units_available, expiry_date, bank_id
requests        — id, patient_name, blood_type, units_needed, hospital_name, urgency_level, status
donations       — id, donor_id, bank_id, blood_type, units, donated_on
forecast_logs   — id, blood_type, predicted_demand, confidence_score, forecast_date
sos_alerts      — id, request_id, alert_sent_to, alert_method, response_count, resolved
```

---

## 📁 Folder Structure

```
red_pulse/
├── app.py                    # Main Flask + SocketIO entry point
├── config.py                 # Environment config loader
├── .env                      # Secret keys and credentials
├── requirements.txt
├── database/
│   ├── db.py                 # SQLAlchemy init
│   ├── models.py             # All ORM models
│   └── seed.py               # Sample data seed script
├── routes/
│   ├── donors.py             # /api/donors/*
│   ├── inventory.py          # /api/inventory/*
│   ├── requests.py           # /api/requests/*
│   ├── banks.py              # /api/banks/*
│   ├── forecast.py           # /api/forecast/* (Feature 1)
│   └── sos.py                # /api/sos/*      (Feature 2)
├── services/
│   ├── location_service.py   # Haversine formula, nearest match
│   ├── forecast_service.py   # ML model training + prediction
│   ├── alert_service.py      # WebSocket + email SOS alerts
│   └── compatibility.py      # Blood type cross-matching logic
├── models/
│   └── demand_forecast.pkl   # Trained RandomForest model
├── sockets/
│   └── events.py             # Socket.IO event handlers
├── static/
│   ├── css/style.css         # Full design system
│   ├── js/dashboard.js       # Dashboard logic + WebSocket client
│   └── js/map.js             # Leaflet.js live map
├── templates/
│   ├── dashboard.html        # Admin dashboard
│   ├── donor_register.html   # Donor registration form
│   ├── request_form.html     # Blood request + urgency form
│   ├── sos_screen.html       # SOS emergency trigger page
│   └── donor_profile.html    # Donor profile + badges
└── tests/
    ├── test_api.py            # API endpoint tests (pytest)
    └── test_forecast.py       # Service unit tests (pytest)
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.10+
- pip

### 1. Clone / Navigate to the project
```powershell
cd "c:\Users\kdbal\OneDrive\Desktop\Red pulse"
```

### 2. Create a virtual environment
```powershell
python -m venv .venv
.\.venv\Scripts\activate
```

### 3. Install dependencies
```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 4. Configure environment variables

Edit `.env` with your credentials:

```env
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your_super_secret_key_change_me_in_prod
DATABASE_URL=sqlite:///database/red_pulse.db
PORT=5000
DEBUG=True

# Email (for SOS alerts via Gmail)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password      # Use a Gmail App Password

# Twilio SMS (optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

> **Gmail App Password Setup**: Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), generate a 16-character app password, and paste it as `SMTP_PASSWORD`.

### 5. Seed the database with sample data
```powershell
.\.venv\Scripts\python.exe -m database.seed
```

### 6. (Optional) Pre-train the ML model
```powershell
.\.venv\Scripts\python.exe -c "from services.forecast_service import train_forecast_model; train_forecast_model()"
```

### 7. Start the server
```powershell
.\.venv\Scripts\python.exe app.py
```

Open your browser at: **http://localhost:5000**

---

## 🖥️ UI Pages

| Page | URL | Description |
|---|---|---|
| Admin Dashboard | `http://localhost:5000/` | Live inventory, map, forecast chart, active requests |
| Donor Registration | `http://localhost:5000/register` | Register with auto geolocation |
| Blood Request | `http://localhost:5000/request` | Submit request, find nearest bank |
| SOS Emergency | `http://localhost:5000/sos` | Trigger emergency, view live response count |
| Donor Profile | `http://localhost:5000/donor/<id>` | Profile, eligibility, badges, history |

---

## 🔌 REST API Endpoints

### Donors
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/donors/register` | Register a new donor |
| GET | `/api/donors` | List all available donors |
| GET | `/api/donors/<id>` | Get donor profile |
| PATCH | `/api/donors/<id>/availability` | Toggle availability |

### Inventory
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/inventory` | Full inventory |
| POST | `/api/inventory/update` | Add/remove units |
| GET | `/api/inventory/low-stock` | Units below threshold |

### Requests
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/requests/new` | Submit a blood request |
| GET | `/api/requests/active` | List active requests |
| PATCH | `/api/requests/<id>/status` | Update request status |

### Blood Banks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/banks` | List all banks |
| GET | `/api/banks/nearest?lat=&lng=` | Find nearest bank |

### AI Forecast (Feature 1)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/forecast/<blood_type>?days=7` | 7-day demand prediction |

### SOS (Feature 2)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/sos/trigger` | Trigger SOS emergency broadcast |

---

## ⚡ WebSocket Events

| Event | Direction | Payload |
|---|---|---|
| `inventory_update` | Server → Client | `{ bank_id, blood_type, units_available }` |
| `new_request` | Server → Client | `{ id, blood_type, hospital_name, urgency_level }` |
| `sos_alert` | Server → Client | `{ hospital_name, blood_type, units }` |
| `donor_response` | Server → Client | `{ donor_id }` |
| `update_location` | Client → Server | `{ donor_id, latitude, longitude }` |

---

## 🧪 Running Tests
```powershell
.\.venv\Scripts\python.exe -m pytest tests/ -v
```

---

## 🌟 Signature Features

### Feature 1: AI Blood Demand Forecasting
- **Library**: `scikit-learn` — `RandomForestRegressor`
- **Data**: Historical requests, seasonal day-of-week/month features
- **Output**: 7-day demand chart (high-demand days in RED), auto-recommendation text
- **API**: `GET /api/forecast/O+?days=7`

### Feature 2: SOS Emergency Alert System
- **Trigger**: Any request with `urgency_level = "SOS"` or via `/api/sos/trigger`
- **Matching**: Haversine-filtered donors within 25km, blood-type compatible, available
- **Channels**: WebSocket in-app popup + Email (SMTP) + SMS (Twilio, optional)
- **Dashboard**: Live countdown timer, donor response counter in real-time

---

## 🩸 Blood Compatibility Chart

| Donor | Can Donate To |
|---|---|
| **O-** | Everyone (Universal Donor) |
| **O+** | O+, A+, B+, AB+ |
| **A-** | A-, A+, AB-, AB+ |
| **A+** | A+, AB+ |
| **B-** | B-, B+, AB-, AB+ |
| **B+** | B+, AB+ |
| **AB-** | AB-, AB+ |
| **AB+** | AB+ only |

---

## 🔒 Security Features

- SQLite WAL mode enabled for concurrent reads
- JWT-ready SECRET_KEY config via `.env`
- Phone/email stored in plaintext but isolated per-user; extend with SHA-256 hashing
- Rate-limiting the SOS endpoint can be added via `flask-limiter`

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.10+, Flask 2.3+, Flask-SocketIO |
| Database | SQLite (via SQLAlchemy ORM) |
| Real-Time | Socket.IO + Eventlet |
| ML | scikit-learn, pandas, numpy, joblib |
| Maps | Leaflet.js (CartoDB dark tiles) |
| Charts | Chart.js 4.x |
| Email | Python smtplib (SMTP/Gmail) |
| SMS | Twilio SDK (optional) |
| Frontend | Vanilla HTML + CSS + JavaScript |

---

## 📄 License
MIT © Red Pulse Team 2026
