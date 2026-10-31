const API = '/api';
let state = { token: localStorage.getItem('hp_token') || null, user: JSON.parse(localStorage.getItem('hp_user') || 'null') };

// ---------- helpers ----------
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return document.querySelectorAll(sel); }

// ---------- auth ----------
$all('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
  $all('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const tab = btn.dataset.tab;
  $('#loginForm').classList.toggle('hidden', tab !== 'login');
  $('#registerForm').classList.toggle('hidden', tab !== 'register');
  $('#authMsg').textContent = '';
}));

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: $('#loginEmail').value, password: $('#loginPassword').value })
    });
    onAuthSuccess(data);
  } catch (err) {
    $('#authMsg').textContent = err.message;
  }
});

$('#registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: $('#regName').value,
        email: $('#regEmail').value,
        password: $('#regPassword').value,
        role: $('#regRole').value
      })
    });
    onAuthSuccess(data);
  } catch (err) {
    $('#authMsg').textContent = err.message;
  }
});

function onAuthSuccess(data) {
  state.token = data.token;
  state.user = data.user;
  localStorage.setItem('hp_token', data.token);
  localStorage.setItem('hp_user', JSON.stringify(data.user));
  enterApp();
}

$('#logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('hp_token');
  localStorage.removeItem('hp_user');
  state = { token: null, user: null };
  location.reload();
});

// ---------- navigation ----------
$all('.nav-btn').forEach(btn => btn.addEventListener('click', () => showView(btn.dataset.view)));

function showView(view) {
  $all('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  $all('.view').forEach(v => v.classList.add('hidden'));
  $('#view-' + view).classList.remove('hidden');
  if (view === 'dashboard') loadDashboard();
  if (view === 'rooms') loadRooms();
  if (view === 'guests') loadGuests();
  if (view === 'bookings') loadBookings();
  if (view === 'payments') loadPayments();
}

function enterApp() {
  $('#view-auth').classList.add('hidden');
  $('#nav').classList.remove('hidden');
  $('#userBox').classList.remove('hidden');
  $('#userName').textContent = `${state.user.name} (${state.user.role})`;
  showView('dashboard');
}

// ---------- dashboard ----------
async function loadDashboard() {
  const [rooms, bookings, payments] = await Promise.all([api('/rooms'), api('/bookings'), api('/payments')]);
  $('#statRooms').textContent = rooms.length;
  $('#statAvailable').textContent = rooms.filter(r => r.status === 'available').length;
  $('#statOccupied').textContent = rooms.filter(r => r.status === 'occupied').length;
  $('#statBookings').textContent = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'checked_out').length;
  const revenue = payments.reduce((sum, p) => sum + p.amount, 0);
  $('#statRevenue').textContent = '₹' + revenue.toLocaleString('en-IN');
}

// ---------- rooms ----------
$('#addRoomBtn').addEventListener('click', () => $('#roomForm').classList.toggle('hidden'));

$('#roomForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/rooms', {
      method: 'POST',
      body: JSON.stringify({
        number: $('#roomNumber').value,
        type: $('#roomType').value,
        pricePerNight: $('#roomPrice').value,
        capacity: $('#roomCapacity').value
      })
    });
    e.target.reset();
    e.target.classList.add('hidden');
    loadRooms();
  } catch (err) { alert(err.message); }
});

async function loadRooms() {
  const rooms = await api('/rooms');
  $('#roomsTable').innerHTML = rooms.map(r => `
    <tr>
      <td>${r.number}</td><td>${r.type}</td><td>₹${r.pricePerNight}</td><td>${r.capacity}</td>
      <td><span class="badge ${r.status}">${r.status}</span></td>
    </tr>
  `).join('');
}

// ---------- guests ----------
$('#addGuestBtn').addEventListener('click', () => $('#guestForm').classList.toggle('hidden'));

$('#guestForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/guests', {
      method: 'POST',
      body: JSON.stringify({
        name: $('#guestName').value,
        phone: $('#guestPhone').value,
        email: $('#guestEmail').value
      })
    });
    e.target.reset();
    e.target.classList.add('hidden');
    loadGuests();
  } catch (err) { alert(err.message); }
});

async function loadGuests() {
  const guests = await api('/guests');
  $('#guestsTable').innerHTML = guests.map(g => `
    <tr><td>${g.name}</td><td>${g.phone}</td><td>${g.email || '-'}</td></tr>
  `).join('');
}

// ---------- bookings ----------
$('#addBookingBtn').addEventListener('click', async () => {
  const form = $('#bookingForm');
  form.classList.toggle('hidden');
  if (!form.classList.contains('hidden')) {
    const [guests, rooms] = await Promise.all([api('/guests'), api('/rooms?status=available')]);
    $('#bookingGuest').innerHTML = guests.map(g => `<option value="${g.id}">${g.name} (${g.phone})</option>`).join('');
    $('#bookingRoom').innerHTML = rooms.map(r => `<option value="${r.id}">Room ${r.number} - ${r.type} (₹${r.pricePerNight}/night)</option>`).join('');
  }
});

$('#bookingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        guestId: $('#bookingGuest').value,
        roomId: $('#bookingRoom').value,
        checkIn: $('#bookingCheckIn').value,
        checkOut: $('#bookingCheckOut').value
      })
    });
    e.target.reset();
    e.target.classList.add('hidden');
    loadBookings();
  } catch (err) { alert(err.message); }
});

async function loadBookings() {
  const [bookings, guests, rooms] = await Promise.all([api('/bookings'), api('/guests'), api('/rooms')]);
  const guestMap = Object.fromEntries(guests.map(g => [g.id, g.name]));
  const roomMap = Object.fromEntries(rooms.map(r => [r.id, r.number]));

  $('#bookingsTable').innerHTML = bookings.map(b => `
    <tr>
      <td>${guestMap[b.guestId] || '-'}</td>
      <td>${roomMap[b.roomId] || '-'}</td>
      <td>${b.checkIn}</td>
      <td>${b.checkOut}</td>
      <td>₹${b.totalAmount}</td>
      <td><span class="badge ${b.status}">${b.status}</span></td>
      <td><span class="badge ${b.paymentStatus}">${b.paymentStatus}</span></td>
      <td>
        ${b.status === 'confirmed' ? `<button class="action-link" onclick="checkIn('${b.id}')">Check-in</button>` : ''}
        ${b.status === 'checked_in' ? `<button class="action-link" onclick="checkOut('${b.id}')">Check-out</button>` : ''}
        ${b.paymentStatus === 'pending' ? `<button class="action-link" onclick="payNow('${b.id}', ${b.totalAmount})">Pay</button>` : ''}
        ${b.status === 'confirmed' ? `<button class="action-link" onclick="cancelBooking('${b.id}')">Cancel</button>` : ''}
      </td>
    </tr>
  `).join('');
}

async function checkIn(id) { await api(`/bookings/${id}/checkin`, { method: 'POST' }); loadBookings(); }
async function checkOut(id) { await api(`/bookings/${id}/checkout`, { method: 'POST' }); loadBookings(); loadRooms(); }
async function cancelBooking(id) { await api(`/bookings/${id}/cancel`, { method: 'POST' }); loadBookings(); loadRooms(); }
async function payNow(bookingId, amount) {
  const method = prompt('Payment method (cash/card/upi/netbanking):', 'upi');
  if (!method) return;
  await api('/payments', { method: 'POST', body: JSON.stringify({ bookingId, method, amount }) });
  loadBookings();
  loadPayments();
}
window.checkIn = checkIn;
window.checkOut = checkOut;
window.cancelBooking = cancelBooking;
window.payNow = payNow;

// ---------- payments ----------
async function loadPayments() {
  const [payments, bookings] = await Promise.all([api('/payments'), api('/bookings')]);
  const bookingMap = Object.fromEntries(bookings.map(b => [b.id, b]));
  $('#paymentsTable').innerHTML = payments.map(p => `
    <tr>
      <td>${p.transactionRef}</td>
      <td>${bookingMap[p.bookingId] ? bookingMap[p.bookingId].checkIn + ' → ' + bookingMap[p.bookingId].checkOut : '-'}</td>
      <td>${p.method.toUpperCase()}</td>
      <td>₹${p.amount}</td>
      <td><span class="badge ${p.status}">${p.status}</span></td>
      <td>${new Date(p.createdAt).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');
}

// ---------- boot ----------
if (state.token && state.user) {
  enterApp();
}
