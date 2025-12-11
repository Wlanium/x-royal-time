# X-Royal-Time

Personalverwaltung & Zeiterfassung mit rumänischer Feiertagsunterstützung.

## Features

- **Mitarbeiterverwaltung** - Personal anlegen und verwalten
- **Projektverwaltung** - Projekte mit Kunden, Budget & Stundensatz für Abrechnung
- **Zeiterfassung** - Stunden auf Projekte buchen
- **Urlaubsverwaltung** - Urlaub planen mit automatischer Arbeitstage-Berechnung
- **Rumänische Feiertage** - Automatisch berücksichtigt
- **Multi-Language** - Deutsch, Englisch, Rumänisch

## Tech Stack

| Teil | Technologie |
|------|-------------|
| Backend | Python FastAPI + SQLite |
| Frontend | Next.js 14 + shadcn/ui + Tailwind |
| Auth | JWT Token |
| i18n | next-intl (DE/EN/RO) |
| Deploy | Docker Compose |

## Schnellstart

### Mit Docker (empfohlen)

```bash
# Repo klonen
git clone <repo-url>
cd x-royal-time

# .env anlegen
cp .env.example .env
# SECRET_KEY in .env ändern!

# Starten
docker-compose up --build
```

### Ohne Docker (Entwicklung)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

## Erster Start

1. Öffne http://localhost:3000
2. Klicke auf **Registrieren**
3. Erster User wird automatisch **Admin**
4. Loslegen!

## API Übersicht

### Auth
- `POST /api/v1/auth/register` - Registrieren
- `POST /api/v1/auth/login` - Anmelden (OAuth2 Form)
- `GET /api/v1/auth/me` - Aktueller User

### Mitarbeiter
- `GET /api/v1/employees/` - Liste
- `POST /api/v1/employees/` - Anlegen
- `PATCH /api/v1/employees/{id}` - Bearbeiten

### Projekte
- `GET /api/v1/projects/` - Liste
- `POST /api/v1/projects/` - Anlegen
- `POST /api/v1/projects/import/csv` - CSV Import
- `GET /api/v1/projects/{id}` - Details mit Stunden-Summary

### Zeiterfassung
- `GET /api/v1/time-entries/` - Liste (Filter: employee_id, date_from, date_to)
- `POST /api/v1/time-entries/` - Eintrag erstellen

### Urlaub
- `GET /api/v1/vacations/` - Alle Anträge
- `POST /api/v1/vacations/` - Urlaub beantragen
- `POST /api/v1/vacations/{id}/approve` - Genehmigen/Ablehnen
- `GET /api/v1/vacations/balance/{employee_id}` - Urlaubskonto
- `GET /api/v1/vacations/calendar/` - Kalenderübersicht

### Feiertage
- `GET /api/v1/holidays/?year=2025&country=RO` - Rumänische Feiertage
- `GET /api/v1/holidays/check?check_date=2025-12-25&country=RO` - Ist Feiertag?

## CSV Import Format (Projekte)

```csv
project_number,name,description,client_name,client_reference,budget_hours,hourly_rate,is_billable
PRJ-001,Website Redesign,Komplettes Redesign,Kunde AG,REF-123,100,85.00,true
PRJ-002,Mobile App,App Entwicklung,Firma GmbH,REF-456,200,95.00,true
```

## Backup

SQLite Datenbank = eine Datei:
```bash
# Im Docker
docker cp xrt-backend:/app/data/app.db ./backup_$(date +%Y%m%d).db

# Lokal
cp backend/data/app.db ./backup_$(date +%Y%m%d).db
```

## Umgebungsvariablen

```env
# Backend
SECRET_KEY=dein-geheimer-key-hier  # openssl rand -hex 32
DATABASE_URL=sqlite+aiosqlite:///./data/app.db
DEBUG=false

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Projektstruktur

```
x-royal-time/
├── backend/
│   ├── app/
│   │   ├── models/      # SQLAlchemy Models
│   │   ├── routers/     # API Endpoints
│   │   ├── schemas/     # Pydantic Schemas
│   │   ├── auth.py      # JWT Auth
│   │   └── main.py      # FastAPI App
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/[locale]/  # Next.js Pages (i18n)
│   │   ├── components/    # UI Components
│   │   └── messages/      # Übersetzungen (DE/EN/RO)
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Lizenz

MIT
