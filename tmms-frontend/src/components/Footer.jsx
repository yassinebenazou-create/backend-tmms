function Footer({ t }) {
  const year = new Date().getFullYear();
  const appName = import.meta.env.VITE_APP_NAME || 'TMMS';
  const version = import.meta.env.VITE_APP_VERSION || '1.0.0';
  const email = 'hbouchi@tmmsgroup.ma';

  return (
    <footer className="mt-8 border-t border-slate-200 bg-white/70 px-4 py-5 text-slate-700 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{appName} - Task & Machine Management System</p>
          <p className="text-xs">{t('footerPlatform')}</p>
        </div>

        <div className="text-xs">
          <p>
            {t('footerContact')}: <a className="font-medium text-blue-600 hover:underline dark:text-blue-400" href={`mailto:${email}`}>{email}</a>
          </p>
          <p className="mt-1">Version {version} | © {year} TMMS Group</p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <a className="hover:text-blue-600 dark:hover:text-blue-400" href="https://www.linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
          <a className="hover:text-blue-600 dark:hover:text-blue-400" href="https://www.facebook.com" target="_blank" rel="noreferrer">Facebook</a>
          <a className="hover:text-blue-600 dark:hover:text-blue-400" href="https://www.instagram.com" target="_blank" rel="noreferrer">Instagram</a>
          <a className="hover:text-blue-600 dark:hover:text-blue-400" href="https://x.com" target="_blank" rel="noreferrer">X</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
