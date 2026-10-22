/**
 * Exportador de datos a formato CSV compatible con Microsoft Excel (UTF-8 con BOM)
 * @param {string} filename - Nombre del archivo a descargar (sin extensión)
 * @param {Array<Object>} rows - Array de objetos a exportar
 */
export function exportToCSV(filename, rows) {
  if (!rows || !rows.length) {
    alert('No hay datos disponibles para exportar.');
    return;
  }

  const separator = ';';
  const keys = Object.keys(rows[0]);

  const csvRows = [
    keys.join(separator), // Encabezados
    ...rows.map((row) =>
      keys
        .map((k) => {
          let cell = row[k] === null || row[k] === undefined ? '' : String(row[k]);
          cell = cell.replace(/"/g, '""');
          if (cell.search(/("|,|\n|;)/g) >= 0) {
            cell = `"${cell}"`;
          }
          return cell;
        })
        .join(separator)
    ),
  ];

  const csvContent = csvRows.join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
