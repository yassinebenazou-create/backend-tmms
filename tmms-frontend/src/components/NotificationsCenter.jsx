import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, FileText, MessageSquare, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { listRequests } from '../api/accessApi';
import { listContactMessages, markContactMessageRead } from '../api/contactApi';

function getInitials(name) {
  return String(name || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function formatTimestamp(value) {
  try {
    return new Date(value).toLocaleString();
  } catch (_error) {
    return '';
  }
}

function getNotificationVisual(item, unread) {
  if (item.type === 'contact') {
    return {
      icon: MessageSquare,
      iconClass: 'text-violet-300',
      badgeClass: unread
        ? 'border-violet-400/40 bg-violet-500/15 text-violet-100 shadow-[0_0_28px_rgba(139,92,246,0.22)]'
        : 'border-slate-700/70 bg-slate-900/40 text-slate-300',
      accentClass: unread ? 'from-violet-500/40 via-fuchsia-500/15 to-slate-900/20' : 'from-slate-700/40 to-slate-900/20'
    };
  }

  if (item.status === 'approved') {
    return {
      icon: CheckCircle2,
      iconClass: 'text-emerald-300',
      badgeClass: unread
        ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100 shadow-[0_0_28px_rgba(16,185,129,0.22)]'
        : 'border-slate-700/70 bg-slate-900/40 text-slate-300',
      accentClass: unread ? 'from-emerald-500/35 via-cyan-500/10 to-slate-900/20' : 'from-slate-700/40 to-slate-900/20'
    };
  }

  if (item.status === 'rejected') {
    return {
      icon: XCircle,
      iconClass: 'text-rose-300',
      badgeClass: unread
        ? 'border-rose-400/40 bg-rose-500/15 text-rose-100 shadow-[0_0_28px_rgba(244,63,94,0.22)]'
        : 'border-slate-700/70 bg-slate-900/40 text-slate-300',
      accentClass: unread ? 'from-rose-500/35 via-orange-500/10 to-slate-900/20' : 'from-slate-700/40 to-slate-900/20'
    };
  }

  return {
    icon: item.type === 'request' ? FileText : Clock3,
    iconClass: 'text-sky-300',
    badgeClass: unread
      ? 'border-sky-400/40 bg-sky-500/15 text-sky-100 shadow-[0_0_28px_rgba(56,189,248,0.22)]'
      : 'border-slate-700/70 bg-slate-900/40 text-slate-300',
    accentClass: unread ? 'from-blue-500/35 via-sky-500/10 to-slate-900/20' : 'from-slate-700/40 to-slate-900/20'
  };
}

function NotificationsCenter({ user, t }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mountedKeys, setMountedKeys] = useState({});
  const menuRef = useRef(null);

  const storageKey = `tmms-notifications-read-${user.id}`;
  const [readMap, setReadMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch (_error) {
      return {};
    }
  });

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await listRequests();
      const requests = res.requests || [];

      const requestItems = requests
        .filter((request) => {
          if (user.role === 'admin') return request.status === 'pending';
          return request.status === 'approved' || request.status === 'rejected';
        })
        .map((request) => {
          const key = `${request.id}:${request.status}`;
          let message = '';

          if (user.role === 'admin') {
            message = t('newAccessRequest', {
              user: request.user?.name || 'User',
              file: request.file?.name || 'File'
            });
          } else if (request.status === 'approved') {
            message = t('requestApprovedFor', { file: request.file?.name || 'File' });
          } else {
            message = t('requestRejectedFor', { file: request.file?.name || 'File' });
          }

          return {
            id: request.id,
            key,
            type: 'request',
            status: request.status,
            message,
            username: request.user?.name || (user.role === 'admin' ? 'User' : user.name),
            timestamp: request.updated_at || request.created_at,
            unread: !readMap[key]
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
          username: item.user?.name || item.name || 'User',
          timestamp: item.created_at
        }));
      }

      const nextItems = [...requestItems, ...contactItems]
        .map((item) => ({
          ...item,
          unread: item.type === 'contact' ? !item.isReadServer : !readMap[item.key]
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setItems(nextItems);
      setMountedKeys((prev) => {
        const next = { ...prev };
        nextItems.forEach((item) => {
          if (!next[item.key]) next[item.key] = true;
        });
        return next;
      });
    } catch (_error) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      setReadMap(JSON.parse(localStorage.getItem(storageKey) || '{}'));
    } catch (_error) {
      setReadMap({});
    }
  }, [storageKey]);

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
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const onEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const unreadCount = useMemo(() => items.filter((item) => item.unread).length, [items]);

  const markAllRead = async () => {
    const nextReadMap = { ...readMap };
    items.forEach((item) => {
      nextReadMap[item.key] = true;
    });
    setReadMap(nextReadMap);

    const unreadContactIds = items
      .filter((item) => item.type === 'contact' && item.unread)
      .map((item) => item.id);

    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        unread: false,
        isReadServer: item.type === 'contact' ? true : item.isReadServer
      }))
    );

    if (unreadContactIds.length) {
      try {
        await Promise.all(unreadContactIds.map((id) => markContactMessageRead(id)));
      } catch (_error) {
        // Keep the local state responsive even if one server sync fails.
      }
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-800/85 px-4 py-2.5 text-sm font-medium text-slate-100 shadow-[0_18px_45px_rgba(15,23,42,0.28)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-sky-400/30 hover:shadow-[0_22px_50px_rgba(59,130,246,0.18)]"
        aria-label={t('notifications')}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-transparent to-violet-500/10 opacity-0 transition duration-300 group-hover:opacity-100" />
        <Bell className="relative h-4 w-4 text-sky-300" />
        <span className="relative hidden sm:inline">{t('notifications')}</span>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border border-red-300/30 bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-[0_0_18px_rgba(239,68,68,0.55)]">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-3 w-[24rem] max-w-[92vw] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.94))] shadow-[0_30px_80px_rgba(2,6,23,0.5)] backdrop-blur-2xl">
          <div className="border-b border-white/10 bg-gradient-to-r from-slate-950/55 via-slate-900/45 to-slate-800/40 px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-sky-300 shadow-[0_0_24px_rgba(56,189,248,0.18)]">
                    <Bell className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{t('notifications')}</p>
                    <p className="text-xs text-slate-400">
                      {unreadCount > 0 ? `${unreadCount} unread` : t('noNotifications')}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={markAllRead}
                className="shrink-0 rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-200 transition hover:border-sky-300/30 hover:bg-sky-500/20 hover:text-white"
              >
                {t('markAllRead')}
              </button>
            </div>
          </div>

          <div className="max-h-[26rem] overflow-y-auto px-3 py-3 tmms-notification-scroll">
            {loading ? (
              <div className="space-y-3 p-1">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-2xl border border-white/8 bg-white/5"
                  />
                ))}
              </div>
            ) : null}

            {!loading && items.length === 0 ? (
              <div className="mx-1 rounded-2xl border border-dashed border-white/10 bg-white/5 px-5 py-10 text-center">
                <p className="text-sm font-medium text-slate-200">{t('noNotifications')}</p>
                <p className="mt-2 text-xs text-slate-400">The panel will fill automatically when new events arrive.</p>
              </div>
            ) : null}

            {!loading && items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item) => {
                  const unread = item.unread;
                  const visual = getNotificationVisual(item, unread);
                  const Icon = visual.icon;

                  return (
                    <div
                      key={item.key}
                      className={`group relative overflow-hidden rounded-2xl border px-4 py-3 transition duration-300 ${
                        unread
                          ? `${visual.badgeClass} notification-enter`
                          : 'border-white/6 bg-slate-950/35 text-slate-300 opacity-70'
                      } ${mountedKeys[item.key] ? 'notification-enter-active' : ''} hover:-translate-y-0.5 hover:scale-[1.01] hover:opacity-100`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${visual.accentClass} opacity-90`} />
                      <div className="absolute inset-x-4 bottom-0 h-px bg-white/10" />
                      <div className="relative flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-900/70 shadow-inner">
                          <span className="text-sm font-semibold tracking-wide text-white">
                            {getInitials(item.username)}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-white">{item.username}</p>
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60">
                                  <Icon className={`h-3.5 w-3.5 ${visual.iconClass}`} />
                                </span>
                              </div>
                              <p className="mt-1 text-sm leading-5 text-slate-200/95">{item.message}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                              {item.type === 'contact' ? 'Message' : 'File'}
                            </span>
                            <span className="text-xs text-slate-400">{formatTimestamp(item.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationsCenter;
