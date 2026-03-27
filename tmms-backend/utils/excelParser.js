const XLSX = require('xlsx');

function toIsoDate(value) {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0));
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
}

function cleanCellValue(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
  return value;
}

function inferColumnType(values) {
  const cleaned = values.filter((v) => v !== null);
  if (cleaned.length === 0) return 'empty';

  const numericCount = cleaned.filter((v) => typeof v === 'number').length;
  const dateCount = cleaned.filter((v) => toIsoDate(v) !== null).length;

  if (numericCount / cleaned.length >= 0.8) return 'numeric';
  if (dateCount / cleaned.length >= 0.8) return 'date';
  return 'category';
}

function parseWorkbook(buffer) {
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  } catch (_error) {
    throw new Error('Invalid or corrupted Excel file.');
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Workbook has no sheets.');
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  if (!worksheet) {
    throw new Error('Unable to read the first worksheet.');
  }

  const rows = XLSX.utils.sheet_to_json(worksheet, {
    defval: null,
    raw: true,
    blankrows: false,
    dateNF: 'yyyy-mm-dd'
  });

  const cleanedRows = rows.map((row) => {
    const nextRow = {};
    Object.keys(row).forEach((key) => {
      nextRow[key] = cleanCellValue(row[key]);
    });
    return nextRow;
  });

  const columnSet = new Set();
  cleanedRows.forEach((row) => {
    Object.keys(row).forEach((key) => columnSet.add(key));
  });
  const columns = [...columnSet];

  const columnTypes = columns.map((column) => {
    const values = cleanedRows.map((row) => row[column]);
    return {
      name: column,
      type: inferColumnType(values)
    };
  });

  return {
    sheetName: firstSheetName,
    totalRows: cleanedRows.length,
    columns: columnTypes,
    preview: cleanedRows.slice(0, 20),
    rows: cleanedRows
  };
}

module.exports = {
  parseWorkbook,
  toIsoDate
};
