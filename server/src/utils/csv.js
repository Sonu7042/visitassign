// Minimal CSV serializer - avoids pulling in a heavyweight dependency for
// the handful of tabular reports this app needs to export.

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

// fields: Array<{ label: string, value: string | (row) => any }>
const toCsv = (rows, fields) => {
  const header = fields.map((f) => escapeCsvValue(f.label)).join(',');
  const lines = rows.map((row) =>
    fields
      .map((f) => escapeCsvValue(typeof f.value === 'function' ? f.value(row) : row[f.value]))
      .join(',')
  );
  return [header, ...lines].join('\n');
};

module.exports = { toCsv };
