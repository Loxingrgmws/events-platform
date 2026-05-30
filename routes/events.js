// Routing dla operacji na wydarzeniach
const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Zapytanie pomocnicze — oblicza liczbę wolnych miejsc dla danego wydarzenia
const freeSpacesSQL = `
  (e.max_participants - COUNT(r.id)) AS free_spaces
`;

// GET /api/events — lista wszystkich wydarzeń z liczbą wolnych miejsc
router.get('/', (req, res) => {
  const events = db.prepare(`
    SELECT
      e.*,
      ${freeSpacesSQL}
    FROM events e
    LEFT JOIN registrations r ON r.event_id = e.id
    GROUP BY e.id
    ORDER BY e.date ASC
  `).all();

  res.json(events);
});

// GET /api/events/:id — szczegóły jednego wydarzenia
router.get('/:id', (req, res) => {
  const event = db.prepare(`
    SELECT
      e.*,
      ${freeSpacesSQL}
    FROM events e
    LEFT JOIN registrations r ON r.event_id = e.id
    WHERE e.id = ?
    GROUP BY e.id
  `).get(req.params.id);

  if (!event) {
    return res.status(404).json({ error: 'Wydarzenie nie zostało znalezione.' });
  }

  res.json(event);
});

// POST /api/events — tworzenie nowego wydarzenia
router.post('/', (req, res) => {
  const { title, description, category, date, location, max_participants } = req.body;

  // Walidacja wymaganych pól
  if (!title || !date || !location || !max_participants) {
    return res.status(400).json({
      error: 'Wymagane pola: tytuł, data, miejsce, maksymalna liczba uczestników.'
    });
  }

  // Walidacja kategorii
  const dozwoloneKategorie = ['cultural', 'sports', 'educational'];
  if (category && !dozwoloneKategorie.includes(category)) {
    return res.status(400).json({
      error: 'Nieprawidłowa kategoria. Dozwolone: cultural, sports, educational.'
    });
  }

  const wynik = db.prepare(`
    INSERT INTO events (title, description, category, date, location, max_participants)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    title,
    description || '',
    category || 'cultural',
    date,
    location,
    parseInt(max_participants)
  );

  // Zwracamy nowo utworzone wydarzenie
  const noweWydarzenie = db.prepare('SELECT * FROM events WHERE id = ?').get(wynik.lastInsertRowid);
  res.status(201).json(noweWydarzenie);
});

module.exports = router;
