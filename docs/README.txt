=====================================
 PLATFORMA WYDARZEŃ LOKALNYCH
 Projekt zaliczeniowy — PRz, Semestr 6
 Przedmiot: Przetwarzanie w chmurze
=====================================

OPIS PROJEKTU
-------------
Aplikacja webowa umożliwiająca mieszkańcom tworzenie, przeglądanie
i rejestrację na wydarzenia lokalne (kulturalne, sportowe, edukacyjne).

Stack technologiczny:
  Backend : Node.js + Express.js
  Baza    : SQLite (better-sqlite3)
  Frontend: HTML + Bootstrap 5 (CDN) + Vanilla JS
  Deploy  : AWS EC2 t2.micro (Ubuntu 22.04) + PM2 + Nginx

URUCHOMIENIE LOKALNE
---------------------
1. Zainstaluj Node.js (wersja 18 lub wyższa):
   https://nodejs.org

2. Sklonuj repozytorium i przejdź do katalogu:
   git clone <URL_REPO>
   cd events-platform

3. Zainstaluj zależności:
   npm install

4. (Opcjonalnie) Utwórz plik .env na podstawie .env.example:
   cp .env.example .env

5. Uruchom serwer:
   node server.js
   lub: npm start

6. Otwórz przeglądarkę:
   http://localhost:3000

STRUKTURA PROJEKTU
-------------------
server.js              - Główny plik serwera Express
database/db.js         - Połączenie SQLite + migracja + seed data
routes/events.js       - Endpointy CRUD dla wydarzeń
routes/registrations.js- Endpoint rejestracji uczestników
public/index.html      - Strona główna (lista wydarzeń)
public/create.html     - Formularz tworzenia wydarzenia
public/event.html      - Szczegóły wydarzenia + formularz rejestracji
scripts/deploy.sh      - Skrypt automatycznego wdrożenia na EC2
.github/workflows/     - Pipeline CI/CD (GitHub Actions)

REST API
---------
GET  /api/events              - lista wszystkich wydarzeń
GET  /api/events/:id          - szczegóły jednego wydarzenia
POST /api/events              - utwórz nowe wydarzenie
POST /api/events/:id/register - zarejestruj uczestnika

WDROŻENIE NA AWS EC2
---------------------
1. Utwórz instancję EC2 t2.micro (Ubuntu 22.04 LTS)
2. W Security Group otwórz porty: 22 (SSH), 80 (HTTP), 3000 (opcjonalnie)
3. Połącz się przez SSH:
   ssh -i klucz.pem ubuntu@<IP_INSTANCJI>
4. Skopiuj kod na serwer (np. git clone lub scp)
5. Uruchom skrypt wdrożenia:
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh
6. Aplikacja działa na http://<IP_INSTANCJI>

CI/CD (GitHub Actions)
-----------------------
Po skonfigurowaniu sekretów w GitHub (EC2_HOST, EC2_USERNAME, EC2_SSH_KEY)
każdy push na gałąź main automatycznie wdraża kod na serwer EC2.

UPGRADE DO OCENY 3.5
----------------------
Zamiana SQLite na AWS RDS PostgreSQL:
1. Utwórz instancję RDS db.t2.micro (PostgreSQL)
2. W database/db.js zastąp better-sqlite3 pakietem pg
3. Zaktualizuj connection string w .env:
   DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/dbname
4. Dostosuj składnię SQL (parametry $1, $2 zamiast ?)
