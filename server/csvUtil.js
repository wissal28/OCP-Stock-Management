// Parseur CSV minimal (gère les guillemets et les virgules/quotes échappées) partagé entre la
// migration utilisateur (migrate.js) et l'import trains/navires (csvImport.js).

export function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}

export function parseCsv(text) {
  const lines = text.trim() ? text.replace(/^﻿/, "").split(/\r?\n/) : [];
  if (lines.length === 0) return [];
  const csvHeaders = parseCsvLine(lines[0]);
  return lines
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const cells = parseCsvLine(line);
      return Object.fromEntries(csvHeaders.map((header, index) => [header, cells[index] ?? ""]));
    });
}
