const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/guests
router.get('/', (req, res) => {
  res.json(db.get('guests').value());
});

// GET /api/guests/:id
router.get('/:id', (req, res) => {
  const guest = db.get('guests').find({ id: req.params.id }).value();
  if (!guest) return res.status(404).json({ message: 'Guest not found.' });
  res.json(guest);
});

// POST /api/guests  -> register a new guest
router.post('/', (req, res) => {
  const { name, email, phone, idProofType, idProofNumber } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ message: 'name and phone are required.' });
  }

  const guest = {
    id: uuid(),
    name,
    email: email || null,
    phone,
    idProofType: idProofType || null,
    idProofNumber: idProofNumber || null,
    createdAt: new Date().toISOString()
  };
  db.get('guests').push(guest).write();
  res.status(201).json(guest);
});

// PUT /api/guests/:id
router.put('/:id', (req, res) => {
  const guest = db.get('guests').find({ id: req.params.id });
  if (!guest.value()) return res.status(404).json({ message: 'Guest not found.' });

  guest.assign(req.body).write();
  res.json(guest.value());
});

// DELETE /api/guests/:id
router.delete('/:id', (req, res) => {
  const guest = db.get('guests').find({ id: req.params.id }).value();
  if (!guest) return res.status(404).json({ message: 'Guest not found.' });

  db.get('guests').remove({ id: req.params.id }).write();
  res.json({ message: 'Guest removed.' });
});

module.exports = router;
