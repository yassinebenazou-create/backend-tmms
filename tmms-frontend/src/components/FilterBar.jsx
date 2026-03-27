function FilterBar({ categories, filters, onChange, onClear, hasDate, t }) {
  return (
    <div className="glass-card rounded-2xl p-4 grid gap-3 md:grid-cols-4">
      <div>
        <label className="text-xs text-slate-600 dark:text-slate-300">{t('filterCategory')}</label>
        <select
          className="mt-1 w-full rounded-lg border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          value={filters.category}
          onChange={(e) => onChange('category', e.target.value)}
        >
          <option value="all">{t('all')}</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-slate-600 dark:text-slate-300">{t('filterStartDate')}</label>
        <input
          type="date"
          disabled={!hasDate}
          className="mt-1 w-full rounded-lg border-slate-300 bg-white text-slate-900 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          value={filters.startDate}
          onChange={(e) => onChange('startDate', e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs text-slate-600 dark:text-slate-300">{t('filterEndDate')}</label>
        <input
          type="date"
          disabled={!hasDate}
          className="mt-1 w-full rounded-lg border-slate-300 bg-white text-slate-900 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          value={filters.endDate}
          onChange={(e) => onChange('endDate', e.target.value)}
        />
      </div>

      <div className="flex items-end">
        <button
          type="button"
          onClick={onClear}
          className="w-full rounded-lg bg-slate-200 px-4 py-2 text-sm text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
        >
          {t('clearFilters')}
        </button>
      </div>
    </div>
  );
}

export default FilterBar;
