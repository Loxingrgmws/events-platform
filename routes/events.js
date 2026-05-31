// Routing dla operacji na wydarzeniach
const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Zapytanie pomocnicze — oblicza liczbę wolnych miejsc dla danego wydarzenia
const freeSpacesSQL = `(e.max_participants - COUNT(r.id)) AS free_spaces`;

// GET /api/events — lista wszystkich wydarzeń z liczbą wolnych miejsc
router.get('/', (req, res) => {
  const events = db.prepare(`
    SELECT
      e.*,
      ${freeSpacesSQL},
      u.username AS creator_name
    FROM events e
    LEFT JOIN registrations r ON r.event_id = e.id
    LEFT JOIN users u ON u.id = e.creator_id
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
      ${freeSpacesSQL},
      u.username AS creator_name
    FROM events e
    LEFT JOIN registrations r ON r.event_id = e.id
    LEFT JOIN users u ON u.id = e.creator_id
    WHERE e.id = ?
    GROUP BY e.id
  `).get(req.params.id);

  if (!event) {
    return res.status(404).json({ error: 'Wydarzenie nie zostało znalezione.' });
  }

  res.json(event);
});

// POST /api/events — tworzenie nowego wydarzenia (tylko zalogowani)
router.post('/', requireAuth, (req, res) => {
  const { title, description, category, date, location, max_participants } = req.body;

  // Walidacja wymaganych pól
  if (!title || !date || !location || !max_participants) {
    return res.status(400).json({
      error: 'Wymagane pola: tytuł, data, miejsce, maksymalna liczba uczestników.'
    });
  }

  const dozwoloneKategorie = ['cultural', 'sports', 'educational'];
  if (category && !dozwoloneKategorie.includes(category)) {
    return res.status(400).json({
      error: 'Nieprawidłowa kategoria. Dozwolone: cultural, sports, educational.'
    });
  }

  // creator_id pochodzi z tokenu JWT (req.user.id)
  const wynik = db.prepare(`
    INSERT INTO events (creator_id, title, description, category, date, location, max_participants)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    title,
    description || '',
    category || 'cultural',
    date,
    location,
    parseInt(max_participants)
  );

  const noweWydarzenie = db.prepare('SELECT * FROM events WHERE id = ?').get(wynik.lastInsertRowid);
  res.status(201).json(noweWydarzenie);
});

// PUT /api/events/:id — edycja wydarzenia (twórca lub admin)
router.put('/:id', requireAuth, (req, res) => {
  const wydarzenie = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);

  if (!wydarzenie) {
    return res.status(404).json({ error: 'Wydarzenie nie zostało znalezione.' });
  }

  // Sprawdzenie uprawnień — tylko twórca lub admin
  const jestTworca = wydarzenie.creator_id === req.user.id;
  const jestAdmin = req.user.role === 'admin';

  if (!jestTworca && !jestAdmin) {
    return res.status(403).json({ error: 'Brak uprawnień do edycji tego wydarzenia.' });
  }

  const { title, description, category, date, location, max_participants } = req.body;

  if (!title || !date || !location || !max_participants) {
    return res.status(400).json({ error: 'Wymagane pola: tytuł, data, miejsce, maks. uczestników.' });
  }

  db.prepare(`
    UPDATE events
    SET title = ?, description = ?, category = ?, date = ?, location = ?, max_participants = ?
    WHERE id = ?
  `).run(
    title,
    description || '',
    category || wydarzenie.category,
    date,
    location,
    parseInt(max_participants),
    req.params.id
  );

  const zaktualizowane = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  res.json(zaktualizowane);
});

// DELETE /api/events/:id — usuwanie wydarzenia (twórca lub admin)
router.delete('/:id', requireAuth, (req, res) => {
  const wydarzenie = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);

  if (!wydarzenie) {
    return res.status(404).json({ error: 'Wydarzenie nie zostało znalezione.' });
  }

  const jestTworca = wydarzenie.creator_id === req.user.id;
  const jestAdmin = req.user.role === 'admin';

  if (!jestTworca && !jestAdmin) {
    return res.status(403).json({ error: 'Brak uprawnień do usunięcia tego wydarzenia.' });
  }

  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.json({ message: `Wydarzenie "${wydarzenie.title}" zostało usunięte.` });
});

module.exports = router;
