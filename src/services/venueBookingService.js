import { springApi, nodeApi } from './api';

// ── Venue Bookings  (Spring Boot /api/venue-bookings) ────────────────────────
// springApi interceptor unwraps res.data — callers receive the body directly.

export const venueBookingService = {
  getAll:        ()              => springApi.get('/venue-bookings'),
  getById:       (bookingId)     => springApi.get(`/venue-bookings/${bookingId}`),
  create:        (data)          => springApi.post('/venue-bookings', data),
  update:        (bookingId, data) => springApi.put(`/venue-bookings/${bookingId}`, data),
  updateStatus:  (bookingId, status) =>
    springApi.patch(`/venue-bookings/${bookingId}/status`, { status }),
  remove:        (bookingId)     => springApi.delete(`/venue-bookings/${bookingId}`),
};

// ── Events  (Spring Boot /api/events) ───────────────────────────────────────
export async function fetchEvents() {
  const res = await springApi.get('/events');
  return Array.isArray(res) ? res : (res.data ?? []);
}

// ── Venues  (Node /api/venues  →  mapped via nodeApi as /venues) ─────────────
// nodeApi baseURL is already ".../api" so path is just "/venues"
export async function fetchVenues() {
  const res = await nodeApi.get('/venues');
  return Array.isArray(res) ? res : (res.data ?? []);
}

// ── Booking ID auto-generator ────────────────────────────────────────────────
export function generateBookingId() {
  const now  = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `VB-${date}-${rand}`;
}
