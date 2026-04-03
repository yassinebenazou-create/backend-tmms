import { useEffect, useMemo, useState } from 'react';
import { Search, Trash2, Users2, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteUserById, listUsers, runDatabaseCleanup } from '../api/accessApi';

function UsersPage({ currentUser, t }) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await listUsers();
        setUsers(res.users || []);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, u.role].some((v) => String(v || '').toLowerCase().includes(q))
    );
  }, [query, users]);

  const deleteUser = async (userToDelete) => {
    if (!userToDelete?.id) return;
    if (userToDelete.id === currentUser?.id) {
      toast.error('You cannot delete your own account.');
      return;
    }

    const confirmed = window.confirm(`Delete user "${userToDelete.name}" (${userToDelete.email})?`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await deleteUserById(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      toast.success(res.message || 'User deleted.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const cleanDatabase = async () => {
    const confirmed = window.confirm('Run cleanup for records older than 90 days?');
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await runDatabaseCleanup(90);
      const removed = res?.removed || {};
      toast.success(
        `Cleanup done. Logs:${removed.auditLogs || 0}, Requests:${removed.accessRequests || 0}, Messages:${removed.contactMessages || 0}, Links:${removed.orphanUserFileLinks || 0}`
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Cleanup failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <section className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('usersPageTitle')}</h2>
        <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <p className="font-semibold text-slate-800 dark:text-slate-100">{currentUser?.name}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{currentUser?.email}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{currentUser?.role}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="glass-card rounded-2xl p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users2 className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('usersPageTitle')}</h2>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <label className="relative block w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('usersSearchPlaceholder')}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <button
              type="button"
              onClick={cleanDatabase}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 shadow-sm transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-600/40 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
            >
              <Database className="h-4 w-4" />
              Clean DB
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('usersTotal')}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">{users.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Admins</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">{users.filter((u) => u.role === 'admin').length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Users</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">{users.filter((u) => u.role !== 'admin').length}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-200/80 dark:bg-slate-800/80">
              <tr>
                <th className="px-4 py-3 text-left">{t('name')}</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{u.name}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{u.email}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{u.role}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{u.id}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={actionLoading || u.id === currentUser?.id}
                      onClick={() => deleteUser(u)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-600/40 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                      title={u.id === currentUser?.id ? 'Cannot delete your own account' : 'Delete user'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {filtered.map((u) => (
            <div key={u.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="font-semibold text-slate-800 dark:text-slate-100">{u.name}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{u.email}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{u.role} • {u.id}</p>
              <button
                type="button"
                disabled={actionLoading || u.id === currentUser?.id}
                onClick={() => deleteUser(u)}
                className="mt-2 inline-flex items-center gap-1 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-600/40 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          ))}
        </div>

        {loading ? <p className="p-4 text-sm text-slate-500">Loading...</p> : null}
        {!loading && filtered.length === 0 ? <p className="p-4 text-sm text-slate-500">{t('usersEmpty')}</p> : null}
      </div>
    </section>
  );
}

export default UsersPage;
