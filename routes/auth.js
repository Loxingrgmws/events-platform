// Routing dla rejestracji, logowania i zarządzania sesją
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

// Pomocnicza funkcja — generuje token JWT ważny 24 godziny
function generujToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// POST /api/auth/register — rejestracja nowego użytkownika
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  // Walidacja pól
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Wymagane pola: nazwa użytkownika, email, hasło.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Hasło musi mieć co najmniej 6 znaków.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Podaj prawidłowy adres e-mail.' });
  }

  // Sprawdzenie czy email lub username jest już zajęty
  const istniejacy = db.prepare(
    'SELECT id FROM users WHERE email = ? OR username = ?'
  ).get(email, username);

  if (istniejacy) {
    return res.status(409).json({ error: 'Użytkownik z tym adresem e-mail lub nazwą już istnieje.' });
  }

  // Hashowanie hasła i zapis użytkownika
  const passwordHash = bcrypt.hashSync(password, 10);
  const wynik = db.prepare(`
    INSERT INTO users (username, email, password_hash, role)
    VALUES (?, ?, ?, 'user')
  `).run(username, email, passwordHash);

  const nowyUser = db.prepare('SELECT * FROM users WHERE id = ?').get(wynik.lastInsertRowid);
  const token = generujToken(nowyUser);

  res.status(201).json({
    message: 'Konto zostało utworzone.',
    token,
    user: { id: nowyUser.id, username: nowyUser.username, email: nowyUser.email, role: nowyUser.role }
  });
});

// POST /api/auth/login — logowanie
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Wymagane pola: email i hasło.' });
  }

  // Wyszukanie użytkownika po emailu
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {
    return res.status(401).json({ error: 'Nieprawidłowy email lub hasło.' });
  }

  // Porównanie hasła z hashem
  const poprawneHaslo = bcrypt.compareSync(password, user.password_hash);
  if (!poprawneHaslo) {
    return res.status(401).json({ error: 'Nieprawidłowy email lub hasło.' });
  }

  const token = generujToken(user);

  res.json({
    message: `Witaj, ${user.username}!`,
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role }
  });
});

// POST /api/auth/logout — wylogowanie
// JWT jest stateless — wylogowanie polega na usunięciu tokenu po stronie klienta
router.post('/logout', (req, res) => {
  res.json({ message: 'Wylogowano pomyślnie.' });
});

// GET /api/auth/me — dane aktualnie zalogowanego użytkownika
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare(
    'SELECT id, username, email, role, created_at FROM users WHERE id = ?'
  ).get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'Użytkownik nie istnieje.' });
  }

  res.json(user);
});

module.exports = router;
