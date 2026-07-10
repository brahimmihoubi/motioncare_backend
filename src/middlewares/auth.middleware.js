const { verifyToken } = require('../utils/jwt.util');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('Auth middleware: ', authHeader);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  req.user = decoded; // { id, role, ... }
  next();
};

module.exports = authMiddleware;
