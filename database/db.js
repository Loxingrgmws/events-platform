// Moduł zarządzający połączeniem z bazą danych SQLite
const Database = require('better-sqlite3');
const path = require('path');

// Ścieżka do pliku bazy danych w katalogu głównym projektu
const dbPath = path.join(__dirname, '..', 'events.db');
const db = new Database(dbPath);

// Włączenie kluczy obcych (domyślnie wyłączone w SQLite)
db.pragma('foreign_keys = ON');

// Tworzenie tabeli wydarzeń jeśli nie istnieje
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT    NOT NULL,
    description   TEXT,
    category      TEXT    NOT NULL CHECK(category IN ('cultural', 'sports', 'educational')),
    date          TEXT    NOT NULL,
    location      TEXT    NOT NULL,
    max_participants INTEGER NOT NULL DEFAULT 50,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

// Tworzenie tabeli rejestracji jeśli nie istnieje
db.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id      INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL,
    registered_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

// Wstawianie danych przykładowych tylko gdy tabela jest pusta
const count = db.prepare('SELECT COUNT(*) AS cnt FROM events').get();
if (count.cnt === 0) {
  const insertEvent = db.prepare(`
    INSERT INTO events (title, description, category, date, location, max_participants)
    VALUES (@title, @description, @category, @date, @location, @max_participants)
  `);

  const seedData = [
    {
      title: 'Wieczór Jazzu pod Gwiazdami',
      description: 'Wyjątkowy koncert jazzowy na świeżym powietrzu z udziałem lokalnych muzyków. Zabierz koc i delektuj się muzyką o zachodzie słońca.',
      category: 'cultural',
      date: '2026-06-15T20:00',
      location: 'Park Miejski, Rzeszów',
      max_participants: 200
    },
    {
      title: 'Maraton Rzeszowski 2026',
      description: 'Coroczny maraton przez ulice Rzeszowa. Trasy: 5 km, 10 km i pełny maraton (42 km). Dla wszystkich poziomów zaawansowania.',
      category: 'sports',
      date: '2026-07-05T08:00',
      location: 'Rynek Główny, Rzeszów',
      max_participants: 500
    },
    {
      title: 'Warsztaty Fotografii Mobilnej',
      description: 'Naucz się jak robić profesjonalne zdjęcia telefonem komórkowym. Omówimy kompozycję, oświetlenie i podstawy edycji w Lightroomie Mobile.',
      category: 'educational',
      date: '2026-06-22T10:00',
      location: 'Biblioteka Miejska, ul. Sokoła 13, Rzeszów',
      max_participants: 30
    },
    {
      title: 'Festiwal Filmów Niezależnych',
      description: 'Przegląd najlepszych polskich i zagranicznych filmów niezależnych z ostatniego roku. Dyskusje z reżyserami po seansach.',
      category: 'cultural',
      date: '2026-08-10T16:00',
      location: 'Kino Helios, Rzeszów',
      max_participants: 150
    },
    {
      title: 'Turniej Szachowy Open',
      description: 'Otwarty turniej szachowy dla wszystkich chętnych. Kategorie wiekowe: junior (do 18 lat) i open. Nagrody rzeczowe dla zwycięzców.',
      category: 'sports',
      date: '2026-07-19T09:00',
      location: 'Centrum Kultury, al. Cieplińskiego 3, Rzeszów',
      max_participants: 64
    }
  ];

  // Wstawianie wszystkich rekordów w jednej transakcji dla wydajności
  const insertMany = db.transaction((events) => {
    for (const event of events) insertEvent.run(event);
  });
  insertMany(seedData);

  console.log('Baza danych zainicjalizowana z przykładowymi danymi.');
}

module.exports = db;
