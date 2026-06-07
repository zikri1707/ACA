import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { run, get } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'aca_secret_key_123_456_789';

// Register User
router.post('/register', async (req, res) => {
  const { name, email, business_name, business_type, password } = req.body;

  if (!name || !email || !business_type || !password) {
    return res.status(400).json({ message: 'Harap lengkapi semua data wajib.' });
  }

  try {
    // Check if email already exists
    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user (default role 2 = User)
    const result = await run(`
      INSERT INTO users (name, email, password_hash, business_name, business_type, role_id)
      VALUES (?, ?, ?, ?, ?, 2)
    `, [name, email, passwordHash, business_name || null, business_type]);

    // Retrieve created user details
    const user = await get(`
      SELECT u.id, u.name, u.email, u.business_name, u.business_type, r.name as role 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [result.id]);

    // Create token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // Log Activity
    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [user.id, 'Registrasi Akun Baru']);

    return res.status(201).json({ token, user });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal meregistrasi pengguna.', error: err.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi.' });
  }

  try {
    const userWithHash = await get(`
      SELECT u.*, r.name as role 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = ?
    `, [email]);

    if (!userWithHash) {
      return res.status(400).json({ message: 'Email atau password salah.' });
    }

    const isMatch = await bcrypt.compare(password, userWithHash.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email atau password salah.' });
    }

    const token = jwt.sign({ id: userWithHash.id, email: userWithHash.email }, JWT_SECRET, { expiresIn: '7d' });

    // Exclude password hash from response
    const { password_hash, ...user } = userWithHash;

    // Log Activity
    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [user.id, 'Login ke Sistem']);

    return res.json({ token, user });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal melakukan login.', error: err.message });
  }
});

// Get User Profile
router.get('/profile', authenticateToken, (req, res) => {
  return res.json({ user: req.user });
});

// Update Profile
router.put('/profile', authenticateToken, async (req, res) => {
  const { name, email, business_name, business_type } = req.body;

  if (!name || !email || !business_type) {
    return res.status(400).json({ message: 'Nama, Email, dan Jenis Usaha wajib diisi.' });
  }

  try {
    // Check if email already used by another user
    const otherUser = await get('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
    if (otherUser) {
      return res.status(400).json({ message: 'Email sudah digunakan oleh akun lain.' });
    }

    await run(`
      UPDATE users 
      SET name = ?, email = ?, business_name = ?, business_type = ?
      WHERE id = ?
    `, [name, email, business_name || null, business_type, req.user.id]);

    const updatedUser = await get(`
      SELECT u.id, u.name, u.email, u.business_name, u.business_type, r.name as role 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [req.user.id]);

    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [req.user.id, 'Pembaruan Profil Pengguna']);

    return res.json({ message: 'Profil berhasil diperbarui.', user: updatedUser });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memperbarui profil.', error: err.message });
  }
});

// Change Password
router.put('/profile/password', authenticateToken, async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Password saat ini dan password baru wajib diisi.' });
  }

  try {
    const user = await get('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);

    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password saat ini salah.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(new_password, salt);

    await run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);
    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [req.user.id, 'Perubahan Password Akun']);

    return res.json({ message: 'Password berhasil diubah.' });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengubah password.', error: err.message });
  }
});

export default router;
