/**
 * A robust, zero-dependency CSV parser that handles commas, double quotes, 
 * escaped quotes, and newlines in field values.
 */
export function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  // Normalize line endings
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped double quote inside quotes
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Closing quote
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        // Opening quote
        inQuotes = true;
      } else if (char === ',') {
        // Field separator
        row.push(currentField.trim());
        currentField = '';
      } else if (char === '\n') {
        // Row separator
        row.push(currentField.trim());
        if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
          result.push(row);
        }
        row = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }
  
  // Push the final field and row if there's remaining content
  if (currentField !== '' || row.length > 0) {
    row.push(currentField.trim());
    if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
      result.push(row);
    }
  }
  
  return result;
}

/**
 * Parses CSV text into an array of objects based on header keys
 */
export function csvToObjects(text: string): { [key: string]: string }[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  
  const headers = rows[0].map(h => h.trim().toLowerCase().replace(/[\s_]+/g, '_'));
  const dataRows = rows.slice(1);
  
  return dataRows.map(row => {
    const obj: { [key: string]: string } = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] !== undefined ? row[index] : '';
    });
    return obj;
  });
}
