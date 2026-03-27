function DataTable({ rows, t }) {
  const headers = rows.length ? Object.keys(rows[0]) : [];

  if (!rows.length) {
    return <div className="glass-card rounded-2xl p-6 text-slate-700 dark:text-slate-300">{t('noRowsMatch')}</div>;
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-200/80 dark:bg-slate-800/80">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-left font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 50).map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-slate-200 hover:bg-slate-100/80 dark:border-slate-800 dark:hover:bg-slate-800/50">
                {headers.map((header) => (
                  <td key={`${rowIndex}-${header}`} className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {String(row[header] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
