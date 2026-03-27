import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { listRequests } from '../api/accessApi';
import { listContactMessages, markContactMessageRead } from '../api/contactApi';

function NotificationsCenter({ user, t }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);

  const storageKey = `tmms-notifications-read-${user.id}`;
  const [readMap, setReadMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch (_e) {
      return {};
    }
  });

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await listRequests();
      const requests = res.requests || [];

      const requestItems = requests
        .filter((r) => {
          if (user.role === 'admin') return r.status === 'pending';
          return r.status === 'approved' || r.status === 'rejected';
        })
        .map((r) => {
          const key = `${r.id}:${r.status}`;
          let message = '';

          if (user.role === 'admin') {
            message = t('newAccessRequest', {
              user: r.user?.name || 'User',
              file: r.file?.name || 'File'
            });
          } else if (r.status === 'approved') {
            message = t('requestApprovedFor', { file: r.file?.name || 'File' });
          } else {
            message = t('requestRejectedFor', { file: r.file?.name || 'File' });
          }

          return {
            id: r.id,
            key,
            type: 'request',
            status: r.status,
            message,
            date: r.updated_at || r.created_at
          };
        });

      let contactItems = [];
      if (user.role === 'admin') {
        const contactRes = await listContactMessages();
        contactItems = (contactRes.messages || []).map((item) => ({
          id: item.id,
          key: `contact:${item.id}:${item.status}`,
          type: 'contact',
          status: item.status,
          isReadServer: item.status === 'read',
          message: t('newContactMessage', {
            user: item.user?.name || item.name || 'User',
            subject: item.subject || 'No subject'
          }),
          date: item.created_at
        }));
      }

      setItems([...requestItems, ...contactItems].sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (_error) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(timer);
  }, [user.id, user.role]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(readMap));
  }, [readMap, storageKey]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const unreadCount = useMemo(() => {
    return items.filter((item) => {
      if (item.type === 'contact') return !item.isReadServer;
      return !readMap[item.key];
    }).length;
  }, [items, readMap]);

  const markAllRead = async () => {
    const next = { ...readMap };
    items.forEach((item) => {
      next[item.key] = true;
    });
    setReadMap(next);

    const unreadContactIds = items
      .filter((item) => item.type === 'contact' && !item.isReadServer)
      .map((item) => item.id);

    if (unreadContactIds.length) {
      try {
        await Promise.all(unreadContactIds.map((id) => markContactMessageRead(id)));
        setItems((prev) =>
          prev.map((item) => (item.type === 'contact' ? { ...item, isReadServer: true, status: 'read' } : item))
        );
      } catch (_error) {
        // Keep local read state even if server read sync fails.
      }
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      >
        <Bell className="h-4 w-4" />
        <span className="hidden sm:inline">{t('notifications')}</span>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">{t('notifications')}</p>
            <button className="text-xs text-blue-600 hover:underline dark:text-blue-400" onClick={markAllRead}>
              {t('markAllRead')}
            </button>
          </div>

          {loading ? <p className="text-xs text-slate-500">...</p> : null}

          {!loading && items.length === 0 ? <p className="text-xs text-slate-500">{t('noNotifications')}</p> : null}

          <div className="max-h-80 space-y-2 overflow-auto">
            {items.map((item) => (
              <div
                key={item.key}
                className={`rounded-lg border p-2 text-xs ${
                  item.type === 'contact'
                    ? item.isReadServer
                      ? 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'
                      : 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10'
                    : readMap[item.key]
                      ? 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'
                      : 'border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10'
                }`}
              >
                <p className="text-slate-700 dark:text-slate-200">{item.message}</p>
                <p className="mt-1 text-[11px] text-slate-500">{new Date(item.date).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationsCenter;
