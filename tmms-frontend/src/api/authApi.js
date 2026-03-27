import api from './axios';

export async function signUp(payload) {
  const response = await api.post('/api/auth/signup', payload);
  return response.data;
}

export async function signIn(payload) {
  const response = await api.post('/api/auth/signin', payload);
  return response.data;
}

export async function getMe() {
  const response = await api.get('/api/auth/me');
  return response.data;
}
