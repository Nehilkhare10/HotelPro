const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const db = require('../db');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required.' });
  }

  const existing = db.get('users').find({ email: email.toLowerCase() }).value();
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = {
    id: uuid(),
    name,
    email: email.toLowerCase(),
    password: hashed,
    role: role === 'admin' ? 'admin' : 'staff', // only two roles for simplicity
    createdAt: new Date().toISOString()
  };

  db.get('users').push(user).write();

  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required.' });
  }

  const user = db.get('users').find({ email: email.toLowerCase() }).value();
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function publicUser(user) {
  const { password, ...safe } = user;
  return safe;
}

module.exports = router;
