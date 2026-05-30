# Tech Stack — Platforma Wydarzeń Lokalnych

## Cel projektu
Platforma umożliwiająca mieszkańcom tworzenie, przeglądanie i rejestrację na wydarzenia lokalne (kulturalne, sportowe, edukacyjne).

---

## Rekomendowany stack (celujemy w 3.0 → łatwy upgrade do 3.5)

### Platforma chmurowa: AWS Free Tier
**Uzasadnienie:**
- Najpopularniejszy dostawca chmury — dobrze znany prowadzącym
- EC2 t2.micro: 750 h/miesiąc gratis przez 12 miesięcy
- RDS (db.t2.micro): 750 h/miesiąc gratis — gotowy na upgrade do 3.5
- Dobra dokumentacja, duża społeczność

### Backend: Node.js + Express.js
- Prosta konfiguracja, szybkie prototypowanie
- Jeden język w całym projekcie (JS)
- Idealne do REST API

### Baza danych:
- **Ocena 3.0**: SQLite (plik `.db` na serwerze EC2, zero konfiguracji)
- **Ocena 3.5**: PostgreSQL na AWS RDS db.t2.micro (darmowe) — prosta zamiana drivera

### Frontend: HTML + Bootstrap 5 (CDN) + Vanilla JS
- Zero build tooling — serwowane bezpośrednio przez Express (`express.static`)
- Bootstrap 5 via CDN (bez instalacji)
- Fetch API do komunikacji z backendem

### Deployment (EC2 Ubuntu 22.04 t2.micro):
- PM2 — process manager dla Node.js (auto-restart po restarcie)
- Nginx — reverse proxy (port 80 → 3000)
- deploy.sh — skrypt automatyzujący uruchomienie (wymagany dla 3.5)

---

## Struktura projektu

```
events-platform/
├── server.js              # Główny plik serwera Express
├── package.json
├── .env.example           # Zmienne środowiskowe
├── database/
│   └── db.js              # Połączenie z SQLite/PostgreSQL
├── routes/
│   ├── events.js          # CRUD wydarzeń
│   └── registrations.js   # Rejestracje na wydarzenia
├── public/                # Frontend (serwowany statycznie)
│   ├── index.html         # Lista wydarzeń
│   ├── create.html        # Formularz tworzenia
│   ├── event.html         # Szczegóły wydarzenia
│   └── css/
│       └── style.css
├── scripts/
│   └── deploy.sh          # Skrypt wdrożenia (dla 3.5)
└── docs/
    └── README.txt         # Dokumentacja projektu
```

---

## Funkcjonalności (minimalne dla 3.0)

1. **Lista wydarzeń** — strona główna z kartami wydarzeń (GET `/api/events`)
2. **Szczegóły wydarzenia** — data, miejsce, opis, liczba wolnych miejsc (GET `/api/events/:id`)
3. **Tworzenie wydarzenia** — formularz (POST `/api/events`)
4. **Rejestracja na wydarzenie** — formularz z imieniem i e-mailem (POST `/api/events/:id/register`)
5. **Licznik miejsc** — automatyczne zmniejszanie dostępnych miejsc po rejestracji

---

## Model danych (SQLite)

### Tabela `events`
| Kolumna | Typ | Opis |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| title | TEXT | Nazwa wydarzenia |
| description | TEXT | Opis |
| category | TEXT | cultural / sports / educational |
| date | TEXT | Data (ISO format) |
| location | TEXT | Miejsce |
| max_participants | INTEGER | Maks. liczba uczestników |
| created_at | TEXT | Timestamp utworzenia |

### Tabela `registrations`
| Kolumna | Typ | Opis |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| event_id | INTEGER FK | Powiązane wydarzenie |
| name | TEXT | Imię i nazwisko |
| email | TEXT | Adres e-mail |
| registered_at | TEXT | Timestamp rejestracji |

---

## Zależności npm

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "better-sqlite3": "^9.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0"
  }
}
```

---

## Plan wdrożenia na AWS EC2

1. Uruchomić instancję EC2 t2.micro (Ubuntu 22.04)
2. Otworzyć port 80 i 3000 w Security Group
3. SSH → zainstalować Node.js, PM2, Nginx
4. Sklonować/przesłać kod, `npm install`
5. `pm2 start server.js --name events-platform`
6. Skonfigurować Nginx jako reverse proxy

---

## Upgrade do oceny 3.5 (co dodać)

1. Zamienić SQLite na **AWS RDS PostgreSQL** (zmiana tylko w `database/db.js` — użyć `pg` zamiast `better-sqlite3`)
2. Dodać skrypt `scripts/deploy.sh` automatyzujący wdrożenie
3. Opisać integrację dwóch usług w dokumentacji

---

## Instrukcja dla Claude Code

Zbuduj aplikację zgodnie z powyższą specyfikacją. Priorytet:
- Działający backend z REST API
- Prosty, czytelny frontend (Bootstrap 5 z CDN)
- SQLite jako baza danych
- Seed data (kilka przykładowych wydarzeń) w `database/db.js`
- Plik `scripts/deploy.sh` z komendami wdrożenia na EC2

Kod ma być prosty, komentowany po polsku i łatwy do zaprezentowania prowadzącemu.
