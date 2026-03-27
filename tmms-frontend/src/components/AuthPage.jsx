import { useState } from 'react';
import Footer from './Footer';

function AuthPage({ onSignIn, onSignUp, loading, language, setLanguage, t }) {
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    if (mode === 'signin') {
      await onSignIn({ email: form.email, password: form.password });
      return;
    }

    await onSignUp({ name: form.name, email: form.email, password: form.password });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 dark:bg-tmms-bg dark:text-slate-100">
      <div className="flex-1 px-4 py-10">
        <div className="mx-auto w-full max-w-md rounded-2xl glass-card p-6">
          <div className="mb-4 flex justify-end">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <img
              src="/company-logo.jfif"
              alt="Company logo"
              className="h-12 w-12 rounded-xl object-cover border border-slate-300 dark:border-slate-700"
            />
            <div>
              <h1 className="text-xl font-semibold">{t('welcomeToTmms')}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">{t('signInOrCreate')}</p>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 rounded-xl bg-slate-200 p-1 dark:bg-slate-800">
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-sm ${mode === 'signin' ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}
              onClick={() => setMode('signin')}
            >
              {t('signIn')}
            </button>
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-sm ${mode === 'signup' ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}
              onClick={() => setMode('signup')}
            >
              {t('signUp')}
            </button>
          </div>

          <form className="space-y-3" onSubmit={onSubmit}>
            {mode === 'signup' ? (
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                placeholder={t('fullName')}
                value={form.name}
                onChange={(e) => onChange('name', e.target.value)}
                required
              />
            ) : null}

            <input
              type="email"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
              placeholder={t('email')}
              value={form.email}
              onChange={(e) => onChange('email', e.target.value)}
              required
            />

            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
              placeholder={t('password')}
              value={form.password}
              onChange={(e) => onChange('password', e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {loading ? t('pleaseWait') : mode === 'signin' ? t('signIn') : t('createAccount')}
            </button>
          </form>
        </div>
      </div>
      <Footer t={t} />
    </div>
  );
}

export default AuthPage;
