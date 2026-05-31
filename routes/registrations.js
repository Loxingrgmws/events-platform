// Routing dla rejestracji na wydarzenia
const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// POST /api/events/:id/register — rejestracja uczestnika (tylko zalogowani)
router.post('/', requireAuth, (req, res) => {
  const eventId = parseInt(req.params.id);
  const { name, email } = req.body;

  // Walidacja danych uczestnika
  if (!name || !email) {
    return res.status(400).json({ error: 'Wymagane pola: imię i nazwisko, adres e-mail.' });
  }

  // Sprawdzenie czy wydarzenie istnieje i czy są wolne miejsca
  const wydarzenie = db.prepare(`
    SELECT e.*, (e.max_participants - COUNT(r.id)) AS free_spaces
    FROM events e
    LEFT JOIN registrations r ON r.event_id = e.id
    WHERE e.id = ?
    GROUP BY e.id
  `).get(eventId);

  if (!wydarzenie) {
    return res.status(404).json({ error: 'Wydarzenie nie zostało znalezione.' });
  }

  if (wydarzenie.free_spaces <= 0) {
    return res.status(409).json({ error: 'Brak wolnych miejsc na to wydarzenie.' });
  }

  // Sprawdzenie czy ten e-mail jest już zarejestrowany
  const istnieje = db.prepare(
    'SELECT id FROM registrations WHERE event_id = ? AND email = ?'
  ).get(eventId, email);

  if (istnieje) {
    return res.status(409).json({ error: 'Ten adres e-mail jest już zarejestrowany na to wydarzenie.' });
  }

  // Zapis rejestracji — powiązanie z kontem użytkownika
  const wynik = db.prepare(`
    INSERT INTO registrations (event_id, user_id, name, email)
    VALUES (?, ?, ?, ?)
  `).run(eventId, req.user.id, name, email);

  res.status(201).json({
    message: `Pomyślnie zarejestrowano na wydarzenie "${wydarzenie.title}".`,
    registration_id: wynik.lastInsertRowid,
    event: wydarzenie.title,
    participant: name
  });
});

module.exports = router;
