// Design philosophy: hard-edged private collection parser supporting ManaBox CSV exports (Name, Quantity, Set, Collector Number).

export interface OwnedCard {
  name: string;
  quantity: number;
  setCode?: string;
  collectorNumber?: string;
}

const STORAGE_KEY = 'mtg_tracker_manabox_collection_v1';

export function saveOwnedCollection(cards: OwnedCard[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (err) {
    console.warn('Failed to save collection to localStorage', err);
  }
}

export function loadOwnedCollection(): OwnedCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (err) {
    console.warn('Failed to load collection from localStorage', err);
  }
  return [];
}

export function clearOwnedCollection(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear collection', err);
  }
}

/**
 * Parses ManaBox CSV exports. Typical headers:
 * Name, Quantity, Set, Collector Number, Foil, Condition, Language, etc.
 * Also supports simple plain text list format: "1x Card Name" or "4 Card Name".
 */
export function parseManaBoxImport(content: string): OwnedCard[] {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const cards: OwnedCard[] = [];
  const firstLine = lines[0]!.toLowerCase();
  const isCsv = firstLine.includes('name') || firstLine.includes('quantity') || firstLine.includes('set') || firstLine.includes(',');

  if (isCsv) {
    // Basic CSV parser handling quoted fields
    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCsvLine(lines[0]!).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const nameIdx = headers.findIndex((h) => h === 'name' || h === 'cardname');
    const qtyIdx = headers.findIndex((h) => h === 'quantity' || h === 'qty' || h === 'count');
    const setIdx = headers.findIndex((h) => h === 'set' || h === 'setcode');
    const collectorIdx = headers.findIndex((h) => h === 'collectornumber' || h === 'number' || h === 'collector');

    const startRow = nameIdx !== -1 || qtyIdx !== -1 ? 1 : 0;

    for (let i = startRow; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]!);
      if (cols.length === 0) continue;

      let name = '';
      let quantity = 1;
      let setCode = '';
      let collectorNumber = '';

      if (nameIdx !== -1 && cols[nameIdx]) {
        name = cols[nameIdx]!.replace(/^["']|["']$/g, '');
      } else {
        name = cols[0]!.replace(/^["']|["']$/g, '');
      }

      if (qtyIdx !== -1 && cols[qtyIdx]) {
        const parsedQty = parseInt(cols[qtyIdx]!, 10);
        if (!isNaN(parsedQty) && parsedQty > 0) quantity = parsedQty;
      }

      if (setIdx !== -1 && cols[setIdx]) {
        setCode = cols[setIdx]!.replace(/^["']|["']$/g, '');
      }

      if (collectorIdx !== -1 && cols[collectorIdx]) {
        collectorNumber = cols[collectorIdx]!.replace(/^["']|["']$/g, '');
      }

      if (name) {
        cards.push({ name, quantity, setCode: setCode || undefined, collectorNumber: collectorNumber || undefined });
      }
    }
  } else {
    // Plain text format: "1x Card Name" or "4 Card Name" or just "Card Name"
    for (const line of lines) {
      const match = line.match(/^(\d+)x?\s+(.+)$/);
      if (match) {
        const qty = parseInt(match[1]!, 10);
        const name = match[2]!.trim();
        cards.push({ name, quantity: isNaN(qty) ? 1 : qty });
      } else if (line) {
        cards.push({ name: line, quantity: 1 });
      }
    }
  }

  // Aggregate duplicates by name
  const map = new Map<string, OwnedCard>();
  for (const card of cards) {
    const key = card.name.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.quantity += card.quantity;
    } else {
      map.set(key, { ...card });
    }
  }

  return Array.from(map.values());
}
