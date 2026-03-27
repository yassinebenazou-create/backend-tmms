import api from './axios';

export async function sendContactMessage(payload) {
  const response = await api.post('/api/contact/messages', payload);
  return response.data;
}

export async function listContactMessages() {
  const response = await api.get('/api/contact/messages');
  return response.data;
}

export async function markContactMessageRead(messageId) {
  const response = await api.patch(`/api/contact/messages/${messageId}/read`);
  return response.data;
}
