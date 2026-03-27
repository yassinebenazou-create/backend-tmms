function KPICards({ kpis, t }) {
  const cards = [
    { label: t('kpiRows'), value: kpis.totalRows, color: 'text-blue-400' },
    { label: t('kpiTotal'), value: kpis.total.toFixed(2), color: 'text-green-400' },
    { label: t('kpiAverage'), value: kpis.average.toFixed(2), color: 'text-amber-400' },
    { label: t('kpiTrend'), value: `${kpis.trend.toFixed(1)}%`, color: kpis.trend >= 0 ? 'text-green-400' : 'text-red-400' }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="glass-card rounded-xl p-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">{card.label}</p>
          <p className={`mt-2 text-2xl font-light ${card.color} animate-counter`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}

export default KPICards;
