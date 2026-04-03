import api from './axios';

export async function listManagedFiles() {
  const response = await api.get('/api/access/files');
  return response.data;
}

export async function uploadManagedFile(formData) {
  const response = await api.post('/api/access/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
}

export async function createPowerBiFile(payload) {
  const response = await api.post('/api/access/files/powerbi', payload);
  return response.data;
}

export async function requestFileAccess(fileId) {
  const response = await api.post(`/api/access/files/${fileId}/request-access`);
  return response.data;
}

export async function listRequests() {
  const response = await api.get('/api/access/requests');
  return response.data;
}

export async function updateRequestStatus(requestId, status) {
  const response = await api.patch(`/api/access/requests/${requestId}`, { status });
  return response.data;
}

export async function assignFileToUsers(fileId, userIds) {
  const response = await api.post(`/api/access/files/${fileId}/assign`, { userIds });
  return response.data;
}

export async function deleteManagedFile(fileId) {
  const response = await api.delete(`/api/access/files/${fileId}`);
  return response.data;
}

export async function listUsers() {
  const response = await api.get('/api/auth/users');
  return response.data;
}

export async function deleteUserById(userId) {
  const response = await api.delete(`/api/auth/users/${userId}`);
  return response.data;
}

export async function runDatabaseCleanup(days = 90) {
  const response = await api.post('/api/auth/cleanup', { days });
  return response.data;
}

export async function downloadManagedFile(fileId, fileName) {
  const response = await api.get(`/api/access/files/${fileId}/download`, { responseType: 'blob' });
  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'file';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
