export function toDateValue(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function buildDashboardData(rows, columns, filters) {
  const numericCols = columns.filter((col) => col.type === 'numeric').map((col) => col.name);
  const categoryCols = columns.filter((col) => col.type === 'category').map((col) => col.name);
  const dateCols = columns.filter((col) => col.type === 'date').map((col) => col.name);

  const primaryNumeric = numericCols[0] || null;
  const primaryCategory = categoryCols[0] || null;
  const primaryDate = dateCols[0] || null;

  let filtered = [...rows];

  if (primaryCategory && filters.category !== 'all') {
    filtered = filtered.filter((row) => String(row[primaryCategory]) === filters.category);
  }

  if (primaryDate && filters.startDate) {
    const start = new Date(filters.startDate);
    filtered = filtered.filter((row) => {
      const d = toDateValue(row[primaryDate]);
      return d ? d >= start : false;
    });
  }

  if (primaryDate && filters.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    filtered = filtered.filter((row) => {
      const d = toDateValue(row[primaryDate]);
      return d ? d <= end : false;
    });
  }

  const categories = primaryCategory
    ? [...new Set(rows.map((row) => row[primaryCategory]).filter((v) => v !== null && v !== undefined))]
    : [];

  const barData = [];
  if (primaryCategory) {
    const grouped = new Map();
    filtered.forEach((row) => {
      const key = String(row[primaryCategory] ?? 'Unknown');
      if (!grouped.has(key)) {
        grouped.set(key, { name: key, value: 0, count: 0 });
      }
      const current = grouped.get(key);
      const n = Number(row[primaryNumeric]);
      current.value += Number.isFinite(n) ? n : 0;
      current.count += 1;
    });
    barData.push(...[...grouped.values()].sort((a, b) => b.value - a.value).slice(0, 12));
  }

  const pieData = barData.length
    ? barData.map((item) => ({ name: item.name, value: item.count }))
    : [];

  const lineData = [];
  if (primaryDate && primaryNumeric) {
    const byMonth = new Map();
    filtered.forEach((row) => {
      const date = toDateValue(row[primaryDate]);
      if (!date) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const value = Number(row[primaryNumeric]);
      const numeric = Number.isFinite(value) ? value : 0;
      byMonth.set(key, (byMonth.get(key) || 0) + numeric);
    });

    lineData.push(
      ...[...byMonth.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, value]) => ({ month, value }))
    );
  } else if (primaryNumeric) {
    filtered.slice(0, 30).forEach((row, index) => {
      const value = Number(row[primaryNumeric]);
      lineData.push({ month: `#${index + 1}`, value: Number.isFinite(value) ? value : 0 });
    });
  }

  const totalRows = filtered.length;
  const numericValues = primaryNumeric
    ? filtered
        .map((row) => Number(row[primaryNumeric]))
        .filter((v) => Number.isFinite(v))
    : [];

  const total = numericValues.reduce((acc, cur) => acc + cur, 0);
  const average = numericValues.length ? total / numericValues.length : 0;

  const midpoint = Math.floor(numericValues.length / 2);
  const prev = numericValues.slice(0, midpoint).reduce((acc, cur) => acc + cur, 0);
  const next = numericValues.slice(midpoint).reduce((acc, cur) => acc + cur, 0);
  const trend = prev === 0 ? 0 : ((next - prev) / Math.abs(prev)) * 100;

  return {
    filteredRows: filtered,
    categories,
    primaryNumeric,
    primaryCategory,
    primaryDate,
    barData,
    pieData,
    lineData,
    kpis: {
      totalRows,
      total,
      average,
      trend
    }
  };
}
