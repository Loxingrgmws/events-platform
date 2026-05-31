// Middleware do weryfikacji tokenów JWT
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-zmien-w-produkcji';

// Weryfikuje token JWT z nagłówka Authorization: Bearer <token>
// Przy sukcesie dołącza req.user = { id, username, email, role }
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Brak tokenu autoryzacji. Zaloguj się.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, username, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token nieważny lub wygasł. Zaloguj się ponownie.' });
  }
}

// Opcjonalna weryfikacja — nie blokuje żądania, tylko dołącza req.user jeśli token istnieje
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
}

// Sprawdza czy zalogowany użytkownik ma rolę admin
// Wymaga wcześniejszego użycia requireAuth
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Brak uprawnień. Wymagana rola administratora.' });
  }
  next();
}

module.exports = { requireAuth, optionalAuth, requireAdmin, JWT_SECRET };
