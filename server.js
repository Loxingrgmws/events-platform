// Główny plik serwera Express — Platforma Wydarzeń Lokalnych
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const eventsRouter = require('./routes/events');
const registrationsRouter = require('./routes/registrations');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());                          // Zezwolenie na żądania z innych domen
app.use(express.json());                  // Parsowanie ciała żądań JSON
app.use(express.static(path.join(__dirname, 'public'))); // Serwowanie plików frontendu

// --- Routing API ---
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/events/:id/register', registrationsRouter);

// --- Start serwera ---
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
  console.log(`Otwórz: http://localhost:${PORT}`);
});
