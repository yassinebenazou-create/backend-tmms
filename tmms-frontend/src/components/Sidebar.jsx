import { useEffect } from 'react';
import { LayoutDashboard, FolderKanban, Users, Settings, LogOut, X, Mail } from 'lucide-react';

const items = [
  { key: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { key: 'files', label: 'Centre de Fichiers', icon: FolderKanban },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'contact', label: 'Contact', icon: Mail },
  { key: 'settings', label: 'Settings', icon: Settings }
];

function Sidebar({ open, onClose, onSelect, onLogout }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    if (open) {
      document.addEventListener('keydown', onKeyDown);
    }

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/70 transition-opacity duration-300 lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-72 border-r border-white/10 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl transition-transform duration-300 lg:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Mobile navigation sidebar"
      >
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Navigation</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onSelect(item.key);
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="mt-4 flex w-full items-center gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-left text-sm text-red-200 transition hover:bg-red-500/20"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
