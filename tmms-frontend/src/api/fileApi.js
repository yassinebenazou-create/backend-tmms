import api from './axios';

export async function uploadExcel(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/api/import/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
}
