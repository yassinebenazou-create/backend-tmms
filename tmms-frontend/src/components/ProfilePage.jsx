import { UserCircle2, Mail, Shield, CalendarDays } from 'lucide-react';

function ProfilePage({ user }) {
  const initials = (user?.name || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="space-y-6">
      <div className="glass-card overflow-hidden rounded-2xl border border-white/10">
        <div className="h-28 bg-gradient-to-r from-blue-600/60 to-violet-600/50" />
        <div className="-mt-12 px-6 pb-6">
          <div className="mb-4 flex items-end gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-slate-100 bg-slate-800 text-2xl font-semibold text-white shadow-lg dark:border-slate-900">
              {initials}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{user?.name || 'User'}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">TMMS Member Profile</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{user?.email || '-'}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <Shield className="h-4 w-4" />
                Role
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{user?.role || '-'}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <UserCircle2 className="h-4 w-4" />
                User ID
              </div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{user?.id || '-'}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <CalendarDays className="h-4 w-4" />
                Last Session
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{new Date().toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white/70 p-5 dark:border-slate-700 dark:bg-slate-900/40">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">About</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              This profile page gives a professional summary of your TMMS account. You can use it as your personal
              identity card inside the platform and manage access-related features from the top menu.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;
