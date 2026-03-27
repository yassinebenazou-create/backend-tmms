import { useEffect, useMemo, useState } from 'react';
import { Search, Users2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { listUsers } from '../api/accessApi';

function UsersPage({ currentUser, t }) {
  const [loading, setLoading] = useState(false);
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

          <label className="relative block w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('usersSearchPlaceholder')}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
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
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{u.name}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{u.email}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{u.role}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{u.id}</td>
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
