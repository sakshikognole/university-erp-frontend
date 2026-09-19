import { springApi, nodeApi } from './api';

// â--â-- Venue Bookings  (Spring Boot /api/venue-bookings) â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
// springApi interceptor unwraps res.data â-- callers receive the body directly.

export const venueBookingService = {
  getAll:        ()              => springApi.get('/venue-bookings'),
  getById:       (bookingId)     => springApi.get(`/venue-bookings/${bookingId}`),
  create:        (data)          => springApi.post('/venue-bookings', data),
  update:        (bookingId, data) => springApi.put(`/venue-bookings/${bookingId}`, data),
  updateStatus:  (bookingId, status) =>
    springApi.patch(`/venue-bookings/${bookingId}/status`, { status }),
  remove:        (bookingId)     => springApi.delete(`/venue-bookings/${bookingId}`),
};

// â--â-- Events  (Spring Boot /api/events) â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
export async function fetchEvents() {
  const res = await springApi.get('/events');
  return Array.isArray(res) ? res : (res.data ?? []);
}

// â--â-- Venues  (Node /api/venues  â--  mapped via nodeApi as /venues) â--â--â--â--â--â--â--â--â--â--â--â--â--
// nodeApi baseURL is already ".../api" so path is just "/venues"
export async function fetchVenues() {
  const res = await nodeApi.get('/venues');
  return Array.isArray(res) ? res : (res.data ?? []);
}

// â--â-- Booking ID auto-generator â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--â--
export function generateBookingId() {
  const now  = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `VB-${date}-${rand}`;
}
