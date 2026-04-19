export function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsvLine(cells: string[]): string {
  return cells.map(escapeCsvCell).join(',');
}
