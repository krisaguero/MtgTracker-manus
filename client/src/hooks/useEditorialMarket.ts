import { useEffect, useState } from 'react';
import type { EditorialPayload } from '@/data/editorialMarket';
export function useEditorialMarket() {
  const [data, setData] = useState<EditorialPayload | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch('/market-history.json').then((r) => { if (!r.ok) throw new Error('Editorial snapshot unavailable'); return r.json(); }).then(setData).finally(() => setLoading(false)); }, []);
  return { data, loading };
}
