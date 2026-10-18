/*
  Minimal HTML table reader for Wikipedia pages (no dependencies).
  Expands rowspan/colspan into a plain grid, flattens multi-row headers into one label
  per column ("Clock rate (GHz) Base") and remembers the headings above each table,
  which often carry the context (series, socket, desktop/mobile).
*/

export interface Table {
  /** Headings above the table, outermost first: ["Desktop processors", "Ryzen 7000 series"] */
  context: string[];
  caption: string;
  headers: string[];
  rows: string[][];
}

const ENTITIES: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ndash: '–', mdash: '—', times: '×', thinsp: ' ', minus: '−' };

export function cleanText(html: string): string {
  return html
    .replace(/<sup[^>]*class="[^"]*reference[^"]*"[\s\S]*?<\/sup>/gi, '') // [1] footnotes
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<span[^>]*display:\s*none[\s\S]*?<\/span>/gi, '') // hidden sort keys
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n: string) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/\[\s*(\d+|[a-z]|note \d+|citation needed)\s*\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface Cell {
  th: boolean;
  text: string;
  rowspan: number;
  colspan: number;
}

const num = (attrs: string, name: string) => {
  const m = attrs.match(new RegExp(`${name}\\s*=\\s*"?(\\d+)`, 'i'));
  return m ? Math.max(1, Math.min(50, Number(m[1]))) : 1;
};

function parseRows(tableHtml: string): Cell[][] {
  const rows: Cell[][] = [];
  for (const tr of tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)(?=<tr[\s>]|<\/tbody>|<\/thead>|<\/table>|$)/gi)) {
    const cells: Cell[] = [];
    for (const c of (tr[1] ?? '').matchAll(/<(th|td)(\s[^>]*)?>([\s\S]*?)(?=<th[\s>]|<td[\s>]|<\/tr>|$)/gi)) {
      const attrs = c[2] ?? '';
      cells.push({ th: c[1]!.toLowerCase() === 'th', text: cleanText((c[3] ?? '').replace(/<\/t[hd]>\s*$/i, '')), rowspan: num(attrs, 'rowspan'), colspan: num(attrs, 'colspan') });
    }
    if (cells.length) rows.push(cells);
  }
  return rows;
}

/** Places cells on a grid honouring rowspan/colspan */
function toGrid(rows: Cell[][]): Array<Array<Cell | undefined>> {
  const grid: Array<Array<Cell | undefined>> = [];
  rows.forEach((cells, r) => {
    grid[r] ??= [];
    let col = 0;
    for (const cell of cells) {
      while (grid[r]![col]) col++;
      for (let dr = 0; dr < cell.rowspan; dr++) {
        grid[r + dr] ??= [];
        for (let dc = 0; dc < cell.colspan; dc++) grid[r + dr]![col + dc] = cell;
      }
      col += cell.colspan;
    }
  });
  return grid;
}

export function parseTables(html: string): Table[] {
  const tables: Table[] = [];
  const headings: string[] = [];
  // Walk headings and wikitables in document order
  const re = /<h([2-5])[^>]*>([\s\S]*?)<\/h\1>|<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
  for (const m of html.matchAll(re)) {
    if (m[1]) {
      const level = Number(m[1]) - 2;
      headings.length = level;
      headings[level] = cleanText(m[2] ?? '').replace(/\s*\[\s*edit\s*\]\s*$/i, '');
      continue;
    }
    const body = m[3] ?? '';
    const caption = cleanText(body.match(/<caption[^>]*>([\s\S]*?)<\/caption>/i)?.[1] ?? '');
    const grid = toGrid(parseRows(body));
    if (!grid.length) continue;

    // Header rows: leading rows made only of <th>
    let h = 0;
    while (h < grid.length - 1 && grid[h]!.every((c) => !c || c.th)) h++;
    if (h === 0) h = 1;
    const width = Math.max(...grid.map((r) => r.length));
    const headers = Array.from({ length: width }, (_, col) => {
      const parts: string[] = [];
      for (let r = 0; r < h; r++) {
        const t = grid[r]?.[col]?.text;
        if (t && parts[parts.length - 1] !== t) parts.push(t);
      }
      return parts.join(' ');
    });
    const rows = grid.slice(h).map((r) => Array.from({ length: width }, (_, col) => r[col]?.text ?? ''));
    tables.push({ context: headings.filter(Boolean), caption, headers, rows });
  }
  return tables;
}

/** Index of the first column whose header matches all given patterns */
export function findCol(headers: string[], ...patterns: RegExp[]): number {
  return headers.findIndex((h) => patterns.every((p) => p.test(h)));
}
