import api from './axios';

export async function listAuditLogs(params = {}) {
  const response = await api.get('/api/audit/logs', { params });
  return response.data;
}

function triggerDownload(blobData, fileName) {
  const blob = new Blob([blobData]);
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export async function exportAuditLogsExcel(params = {}) {
  const response = await api.get('/api/audit/logs/export/excel', { params, responseType: 'blob' });
  triggerDownload(response.data, `audit-logs-${Date.now()}.xlsx`);
}

export async function exportAuditLogsPdf(params = {}) {
  const response = await api.get('/api/audit/logs/export/pdf', { params, responseType: 'blob' });
  triggerDownload(response.data, `audit-logs-${Date.now()}.pdf`);
}

export async function clearAllAuditLogs() {
  const response = await api.delete('/api/audit/logs');
  return response.data;
}
