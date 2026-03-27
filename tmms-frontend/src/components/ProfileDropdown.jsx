import { useEffect, useRef, useState } from 'react';
import { UserCircle2, Settings, LogOut, User } from 'lucide-react';

function ProfileDropdown({ onLogout, onOpenProfile, onOpenSettings }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="User menu"
      >
        <UserCircle2 className="h-6 w-6" />
      </button>

      <div
        className={`absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl transition duration-200 dark:border-slate-700 dark:bg-slate-900 ${open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'}`}
        role="menu"
      >
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onOpenProfile();
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          role="menuitem"
        >
          <User className="h-4 w-4" />
          Profile
        </button>

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onOpenSettings();
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          role="menuitem"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onLogout();
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20"
          role="menuitem"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default ProfileDropdown;
