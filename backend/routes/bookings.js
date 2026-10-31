const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function nightsBetween(checkIn, checkOut) {
  const ms = new Date(checkOut) - new Date(checkIn);
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

// GET /api/bookings
router.get('/', (req, res) => {
  res.json(db.get('bookings').value());
});

// GET /api/bookings/:id
router.get('/:id', (req, res) => {
  const booking = db.get('bookings').find({ id: req.params.id }).value();
  if (!booking) return res.status(404).json({ message: 'Booking not found.' });
  res.json(booking);
});

// POST /api/bookings  -> create a booking, blocks the room, calculates total
router.post('/', (req, res) => {
  const { guestId, roomId, checkIn, checkOut } = req.body;
  if (!guestId || !roomId || !checkIn || !checkOut) {
    return res.status(400).json({ message: 'guestId, roomId, checkIn and checkOut are required.' });
  }

  const guest = db.get('guests').find({ id: guestId }).value();
  if (!guest) return res.status(404).json({ message: 'Guest not found.' });

  const room = db.get('rooms').find({ id: roomId });
  const roomVal = room.value();
  if (!roomVal) return res.status(404).json({ message: 'Room not found.' });
  if (roomVal.status !== 'available') {
    return res.status(409).json({ message: `Room ${roomVal.number} is not available.` });
  }

  const nights = nightsBetween(checkIn, checkOut);
  const totalAmount = nights * roomVal.pricePerNight;

  const booking = {
    id: uuid(),
    guestId,
    roomId,
    checkIn,
    checkOut,
    nights,
    totalAmount,
    status: 'confirmed', // confirmed | checked_in | checked_out | cancelled
    paymentStatus: 'pending', // pending | paid
    createdAt: new Date().toISOString()
  };

  db.get('bookings').push(booking).write();
  room.assign({ status: 'occupied' }).write();

  res.status(201).json(booking);
});

// POST /api/bookings/:id/checkin
router.post('/:id/checkin', (req, res) => {
  const booking = db.get('bookings').find({ id: req.params.id });
  if (!booking.value()) return res.status(404).json({ message: 'Booking not found.' });

  booking.assign({ status: 'checked_in' }).write();
  res.json(booking.value());
});

// POST /api/bookings/:id/checkout  -> frees up the room
router.post('/:id/checkout', (req, res) => {
  const booking = db.get('bookings').find({ id: req.params.id });
  const bookingVal = booking.value();
  if (!bookingVal) return res.status(404).json({ message: 'Booking not found.' });

  booking.assign({ status: 'checked_out' }).write();
  db.get('rooms').find({ id: bookingVal.roomId }).assign({ status: 'available' }).write();

  res.json(booking.value());
});

// POST /api/bookings/:id/cancel  -> frees up the room
router.post('/:id/cancel', (req, res) => {
  const booking = db.get('bookings').find({ id: req.params.id });
  const bookingVal = booking.value();
  if (!bookingVal) return res.status(404).json({ message: 'Booking not found.' });

  booking.assign({ status: 'cancelled' }).write();
  db.get('rooms').find({ id: bookingVal.roomId }).assign({ status: 'available' }).write();

  res.json(booking.value());
});

module.exports = router;
