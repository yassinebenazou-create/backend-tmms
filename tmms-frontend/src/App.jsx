import { useEffect, useMemo, useState } from 'react';
import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadExcel } from './api/fileApi';
import { getMe, signIn, signUp } from './api/authApi';
import AuthPage from './components/AuthPage';
import FileUploader from './components/FileUploader';
import KPICards from './components/KPICards';
import FilterBar from './components/FilterBar';
import ChartPanel from './components/ChartPanel';
import DataTable from './components/DataTable';
import FileAccessCenter from './components/FileAccessCenter';
import UsersPage from './components/UsersPage';
import Footer from './components/Footer';
import NotificationsCenter from './components/NotificationsCenter';
import Sidebar from './components/Sidebar';
import ProfileDropdown from './components/ProfileDropdown';
import ProfilePage from './components/ProfilePage';
import ContactPage from './components/ContactPage';
import AuditLogsPage from './components/AuditLogsPage';
import { buildDashboardData } from './components/chartUtils';
import { createTranslator } from './i18n';

const initialFilters = {
  category: 'all',
  startDate: '',
  endDate: ''
};

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('tmms-theme') || 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem('tmms-lang') || 'en');
  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem('tmms-token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('tmms-user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  });

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [activeModule, setActiveModule] = useState('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = useMemo(() => createTranslator(language), [language]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('tmms-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('tmms-lang', language);
  }, [language]);

  useEffect(() => {
    async function bootstrapAuth() {
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const data = await getMe();
        setUser(data.user);
        localStorage.setItem('tmms-user', JSON.stringify(data.user));
      } catch (_error) {
        setToken(null);
        setUser(null);
        localStorage.removeItem('tmms-token');
        localStorage.removeItem('tmms-user');
      } finally {
        setAuthLoading(false);
      }
    }

    bootstrapAuth();
  }, [token]);

  const dashboard = useMemo(() => {
    if (!payload) {
      return {
        filteredRows: [],
        categories: [],
        primaryDate: null,
        barData: [],
        lineData: [],
        pieData: [],
        kpis: { totalRows: 0, total: 0, average: 0, trend: 0 }
      };
    }

    return buildDashboardData(payload.rows || [], payload.columns || [], filters);
  }, [payload, filters]);

  const onSignIn = async (form) => {
    setAuthSubmitting(true);
    try {
      const data = await signIn(form);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('tmms-token', data.token);
      localStorage.setItem('tmms-user', JSON.stringify(data.user));
      toast.success(t('welcomeBack', { name: data.user.name }));
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || t('signInFailed');
      toast.error(message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const onSignUp = async (form) => {
    setAuthSubmitting(true);
    try {
      const data = await signUp(form);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('tmms-token', data.token);
      localStorage.setItem('tmms-user', JSON.stringify(data.user));
      toast.success(t('accountCreated'));
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || t('signUpFailed');
      toast.error(message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const onLogout = () => {
    setToken(null);
    setUser(null);
    setPayload(null);
    setFile(null);
    setFilters(initialFilters);
    localStorage.removeItem('tmms-token');
    localStorage.removeItem('tmms-user');
    toast.success(t('signedOut'));
  };

  const onFileChange = (event) => {
    const next = event.target.files?.[0];
    if (!next) return;

    const validExtension = next.name.toLowerCase().endsWith('.xlsx') || next.name.toLowerCase().endsWith('.xls');
    if (!validExtension) {
      toast.error(t('invalidExcel'));
      return;
    }

    setFile(next);
  };

  const onUpload = async () => {
    if (!file) {
      toast.error(t('selectFileFirst'));
      return;
    }

    setLoading(true);

    const timeoutToast = setTimeout(() => {
      toast(t('serverWarming'));
    }, 3000);

    try {
      const data = await uploadExcel(file);
      setPayload(data);
      setFilters(initialFilters);
      toast.success(t('parsedRows', { count: data.totalRows, file: data.fileName }));
    } catch (error) {
      const message = error?.response?.data?.message || error.message || t('uploadFailed');
      toast.error(message);
    } finally {
      clearTimeout(timeoutToast);
      setLoading(false);
    }
  };

  const onFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(initialFilters);

  const onSidebarSelect = (key) => {
    if (key === 'dashboard') {
      setActiveModule('analytics');
      return;
    }
    if (key === 'files') {
      setActiveModule('files');
      return;
    }
    if (key === 'users') {
      setActiveModule('users');
      return;
    }
    if (key === 'audit') {
      setActiveModule('audit');
      return;
    }
    if (key === 'settings') {
      setActiveModule('settings');
      return;
    }
    if (key === 'contact') {
      setActiveModule('contact');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 transition-colors dark:bg-tmms-bg dark:text-slate-100">
        <main className="flex-1 grid place-items-center px-4">
          <p className="text-sm">{t('loadingSession')}</p>
        </main>
        <Footer t={t} />
      </div>
    );
  }

  if (!token || !user) {
    return <AuthPage onSignIn={onSignIn} onSignUp={onSignUp} loading={authSubmitting} language={language} setLanguage={setLanguage} t={t} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 transition-colors dark:bg-tmms-bg dark:text-slate-100">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={onSidebarSelect}
        onLogout={onLogout}
        currentUser={user}
      />
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 lg:hidden"
                  aria-label="Open mobile menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <img
                  src="/company-logo.jfif"
                  alt="Company logo"
                  className="h-12 w-12 rounded-xl border border-slate-300 object-cover dark:border-slate-700"
                />
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('appTitle')}</h1>
              </div>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                {t('signedInAs', { name: user.name, role: user.role })}
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
              <NotificationsCenter user={user} t={t} />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
              <button
                type="button"
                onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === 'dark' ? t('lightMode') : t('darkMode')}
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="hidden lg:inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                <LogOut className="h-4 w-4" />
                {t('signOut')}
              </button>
              <ProfileDropdown
                onLogout={onLogout}
                onOpenProfile={() => setActiveModule('profile')}
                onOpenSettings={() => setActiveModule('settings')}
              />
            </div>
          </header>

          <div className="glass-card rounded-2xl p-2 flex flex-col gap-2 sm:flex-row">
            <button
              className={`w-full rounded-xl px-4 py-2 text-sm sm:w-auto ${activeModule === 'analytics' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}
              onClick={() => setActiveModule('analytics')}
            >
              {t('analytics')}
            </button>
            <button
              className={`w-full rounded-xl px-4 py-2 text-sm sm:w-auto ${activeModule === 'files' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}
              onClick={() => setActiveModule('files')}
            >
              {t('fileCenter')}
            </button>
            <button
              className={`w-full rounded-xl px-4 py-2 text-sm sm:w-auto ${activeModule === 'users' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}
              onClick={() => setActiveModule('users')}
            >
              Users
            </button>
            {user?.role === 'admin' ? (
              <button
                className={`w-full rounded-xl px-4 py-2 text-sm sm:w-auto ${activeModule === 'audit' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}
                onClick={() => setActiveModule('audit')}
              >
                {t('auditLogs')}
              </button>
            ) : null}
            <button
              className={`w-full rounded-xl px-4 py-2 text-sm sm:w-auto ${activeModule === 'contact' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}
              onClick={() => setActiveModule('contact')}
            >
              Contact
            </button>
          </div>

          {activeModule === 'analytics' ? (
            <>
              <FileUploader file={file} loading={loading} onChange={onFileChange} onSubmit={onUpload} t={t} />

              {payload ? (
                <>
                  <section className="glass-card rounded-2xl p-4">
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">{t('detectedColumns')}</h2>
                    <div className="flex flex-wrap gap-2">
                      {payload.columns?.map((col) => (
                        <span
                          key={col.name}
                          className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {col.name}: <strong>{col.type}</strong>
                        </span>
                      ))}
                    </div>
                  </section>

                  <KPICards kpis={dashboard.kpis} t={t} />

                  <FilterBar
                    categories={dashboard.categories}
                    filters={filters}
                    onChange={onFilterChange}
                    onClear={clearFilters}
                    hasDate={Boolean(dashboard.primaryDate)}
                    t={t}
                  />

                  <ChartPanel
                    barData={dashboard.barData}
                    lineData={dashboard.lineData}
                    pieData={dashboard.pieData}
                    theme={theme}
                    t={t}
                  />

                  <section>
                    <h2 className="mb-3 text-lg font-semibold">{t('tableViewFiltered')}</h2>
                    <DataTable rows={dashboard.filteredRows} t={t} />
                  </section>
                </>
              ) : (
                <section className="glass-card rounded-2xl p-8 text-center text-slate-700 dark:text-slate-300">
                  {t('uploadPrompt')}
                </section>
              )}
            </>
          ) : activeModule === 'files' ? (
            <FileAccessCenter user={user} t={t} />
          ) : activeModule === 'users' ? (
            <UsersPage currentUser={user} t={t} />
          ) : activeModule === 'audit' ? (
            <AuditLogsPage currentUser={user} t={t} />
          ) : activeModule === 'profile' ? (
            <ProfilePage user={user} />
          ) : activeModule === 'contact' ? (
            <ContactPage user={user} t={t} />
          ) : (
            <section className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Settings</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Settings panel is ready for your next preferences.</p>
            </section>
          )}
        </div>
      </main>
      <Footer t={t} />
    </div>
  );
}

export default App;
