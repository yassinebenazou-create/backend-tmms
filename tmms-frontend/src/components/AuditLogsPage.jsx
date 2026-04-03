import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, RefreshCcw, Search, FileSpreadsheet, FileText, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { clearAllAuditLogs, exportAuditLogsExcel, exportAuditLogsPdf, listAuditLogs } from '../api/auditApi';
import { listUsers } from '../api/accessApi';

function formatDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch (_error) {
    return String(value);
  }
}

function AuditLogsPage({ currentUser, t }) {
  const isAdmin = currentUser?.role === 'admin';
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    actorId: '',
    dateFrom: '',
    dateTo: ''
  });

  const fetchData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [logsRes, usersRes] = await Promise.all([
        listAuditLogs({ ...filters, limit: 200 }),
        listUsers()
      ]);
      setLogs(logsRes.logs || []);
      setUsers(usersRes.users || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const actionOptions = useMemo(() => {
    const unique = new Set((logs || []).map((l) => l.action).filter(Boolean));
    return Array.from(unique).sort();
  }, [logs]);

  const onExportExcel = async () => {
    setExportingExcel(true);
    try {
      await exportAuditLogsExcel({ ...filters });
      toast.success(t('auditExportExcelSuccess'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('auditExportFailed'));
    } finally {
      setExportingExcel(false);
    }
  };

  const onExportPdf = async () => {
    setExportingPdf(true);
    try {
      await exportAuditLogsPdf({ ...filters });
      toast.success(t('auditExportPdfSuccess'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('auditExportFailed'));
    } finally {
      setExportingPdf(false);
    }
  };

  const onClearAllLogs = async () => {
    const confirmed = window.confirm('Delete ALL audit logs? This action cannot be undone.');
    if (!confirmed) return;

    setClearing(true);
    try {
      const res = await clearAllAuditLogs();
      setLogs([]);
      toast.success(res?.message || t('auditClearSuccess'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('auditClearFailed'));
    } finally {
      setClearing(false);
    }
  };

  if (!isAdmin) {
    return (
      <section className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('auditLogs')}</h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{t('usersForbidden')}</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="glass-card rounded-2xl p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('auditLogs')}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onExportExcel}
              disabled={exportingExcel}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-600/40 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {exportingExcel ? t('pleaseWait') : t('exportExcel')}
            </button>
            <button
              type="button"
              onClick={onExportPdf}
              disabled={exportingPdf}
              className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-60 dark:border-red-600/40 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
            >
              <FileText className="h-4 w-4" />
              {exportingPdf ? t('pleaseWait') : t('exportPdf')}
            </button>
            <button
              type="button"
              onClick={fetchData}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t('refreshing')}
            </button>
            <button
              type="button"
              onClick={onClearAllLogs}
              disabled={clearing}
              className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-60 dark:border-red-600/40 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
            >
              <Trash2 className="h-4 w-4" />
              {clearing ? t('pleaseWait') : t('clearAllAuditLogs')}
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <div className="grid gap-3 lg:grid-cols-5">
          <label className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder={t('searchAudit')}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>

          <select
            value={filters.action}
            onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">{t('allActions')}</option>
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>

          <select
            value={filters.actorId}
            onChange={(e) => setFilters((prev) => ({ ...prev, actorId: e.target.value }))}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">{t('allUsers')}</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchData}
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            {t('applyFilters')}
          </button>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-200/80 dark:bg-slate-800/80">
              <tr>
                <th className="px-4 py-3 text-left">{t('date')}</th>
                <th className="px-4 py-3 text-left">{t('user')}</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Entity</th>
                <th className="px-4 py-3 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{formatDate(log.created_at)}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    <p>{log.actor_name || '-'}</p>
                    <p className="text-xs text-slate-500">{log.actor_email || '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{log.action}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {log.entity_type}
                    {log.entity_id ? ` (${log.entity_id})` : ''}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {JSON.stringify(log.details || {})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {logs.map((log) => (
            <div key={log.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-xs text-slate-500">{formatDate(log.created_at)}</p>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{log.action}</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{log.actor_name || '-'}</p>
              <p className="text-xs text-slate-500">{log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}</p>
            </div>
          ))}
        </div>

        {loading ? <p className="p-4 text-sm text-slate-500">Loading...</p> : null}
        {!loading && logs.length === 0 ? <p className="p-4 text-sm text-slate-500">{t('noAuditLogs')}</p> : null}
      </div>
    </section>
  );
}

export default AuditLogsPage;
