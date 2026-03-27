const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Missing token.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_this_to_long_random_string');
    req.user = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Invalid token.' });
  }
}

module.exports = authMiddleware;
