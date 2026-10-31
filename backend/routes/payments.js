const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/payments
router.get('/', (req, res) => {
  res.json(db.get('payments').value());
});

// POST /api/payments  -> record a (simulated) payment against a booking
router.post('/', (req, res) => {
  const { bookingId, method, amount } = req.body;
  if (!bookingId || !method || !amount) {
    return res.status(400).json({ message: 'bookingId, method and amount are required.' });
  }

  const booking = db.get('bookings').find({ id: bookingId });
  const bookingVal = booking.value();
  if (!bookingVal) return res.status(404).json({ message: 'Booking not found.' });

  // This is a simulated/mock payment gateway for demo purposes.
  // Swap in Razorpay/Stripe here for a real integration.
  const payment = {
    id: uuid(),
    bookingId,
    method, // cash | card | upi | netbanking
    amount: Number(amount),
    status: 'success',
    transactionRef: 'TXN-' + uuid().slice(0, 8).toUpperCase(),
    createdAt: new Date().toISOString()
  };

  db.get('payments').push(payment).write();
  booking.assign({ paymentStatus: 'paid' }).write();

  res.status(201).json(payment);
});

module.exports = router;
