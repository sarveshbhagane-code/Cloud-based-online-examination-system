const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticate, generateToken } = require('../middleware/auth');
const router = express.Router();

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6','#06b6d4','#3b82f6'];

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required.' });
    if (db.findOne('users', u => u.email === email)) return res.status(409).json({ error: 'Email already exists.' });
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'admin' ? 'admin' : 'student';
    const avatarColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const user = { id, name, email, password: hashedPassword, role: userRole, avatar_color: avatarColor, created_at: new Date().toISOString() };
    db.insert('users', user);
    const token = generateToken(user);
    res.status(201).json({ message: 'Registration successful!', token, user: { id, name, email, role: userRole, avatar_color: avatarColor } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Registration failed.' }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const user = db.findOne('users', u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid email or password.' });
    const token = generateToken(user);
    res.json({ message: 'Login successful!', token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_color: user.avatar_color } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Login failed.' }); }
});

router.get('/me', authenticate, (req, res) => {
  const user = db.findOne('users', u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_color: user.avatar_color, created_at: user.created_at } });
});

module.exports = router;
