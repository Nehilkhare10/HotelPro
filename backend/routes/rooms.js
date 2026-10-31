const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/rooms  -> list all rooms (supports ?status=available)
router.get('/', (req, res) => {
  let rooms = db.get('rooms').value();
  if (req.query.status) {
    rooms = rooms.filter(r => r.status === req.query.status);
  }
  res.json(rooms);
});

// GET /api/rooms/:id
router.get('/:id', (req, res) => {
  const room = db.get('rooms').find({ id: req.params.id }).value();
  if (!room) return res.status(404).json({ message: 'Room not found.' });
  res.json(room);
});

// POST /api/rooms  -> create a room (admin only)
router.post('/', requireRole('admin'), (req, res) => {
  const { number, type, pricePerNight, capacity } = req.body;
  if (!number || !type || !pricePerNight) {
    return res.status(400).json({ message: 'number, type and pricePerNight are required.' });
  }

  const exists = db.get('rooms').find({ number }).value();
  if (exists) return res.status(409).json({ message: 'Room number already exists.' });

  const room = {
    id: uuid(),
    number,
    type,
    pricePerNight: Number(pricePerNight),
    capacity: capacity ? Number(capacity) : 2,
    status: 'available', // available | occupied | maintenance
    createdAt: new Date().toISOString()
  };
  db.get('rooms').push(room).write();
  res.status(201).json(room);
});

// PUT /api/rooms/:id  -> update a room (admin only)
router.put('/:id', requireRole('admin'), (req, res) => {
  const room = db.get('rooms').find({ id: req.params.id });
  if (!room.value()) return res.status(404).json({ message: 'Room not found.' });

  room.assign(req.body).write();
  res.json(room.value());
});

// DELETE /api/rooms/:id  -> remove a room (admin only)
router.delete('/:id', requireRole('admin'), (req, res) => {
  const room = db.get('rooms').find({ id: req.params.id }).value();
  if (!room) return res.status(404).json({ message: 'Room not found.' });

  db.get('rooms').remove({ id: req.params.id }).write();
  res.json({ message: 'Room deleted.' });
});

module.exports = router;
