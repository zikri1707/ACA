import jwt from 'jsonwebtoken';
import { get } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'aca_secret_key_123_456_789';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak: Token tidak ditemukan.' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Sesi kedaluwarsa atau token tidak valid.' });
    }

    try {
      const user = await get(`
        SELECT u.id, u.name, u.email, u.business_name, u.business_type, r.name as role 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.id = ?
      `, [decoded.id]);

      if (!user) {
        return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
      }

      req.user = user;
      next();
    } catch (dbErr) {
      return res.status(500).json({ message: 'Kesalahan internal server.', error: dbErr.message });
    }
  });
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Akses khusus Administrator.' });
  }
  next();
};
