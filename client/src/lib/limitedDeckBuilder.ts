export const LIMITED_WORKSPACE_STORAGE_KEY = 'mtg_tracker_limited_workspace_v1';
export type LimitedColor = 'W' | 'U' | 'B' | 'R' | 'G';
export interface LimitedPoolCard { name: string; quantity: number; deckQuantity: number; colors: LimitedColor[] }
export interface LimitedWorkspace { version: 1; mode: 'sealed' | 'draft'; pool: LimitedPoolCard[]; basicLands: Record<LimitedColor, number> }
export const EMPTY_LIMITED_WORKSPACE: LimitedWorkspace = { version: 1, mode: 'sealed', pool: [], basicLands: { W: 0, U: 0, B: 0, R: 0, G: 0 } };
const COLORS: LimitedColor[] = ['W', 'U', 'B', 'R', 'G'];

export function parseLimitedPool(text: string): LimitedPoolCard[] {
  const cards = new Map<string, LimitedPoolCard>();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(?:(\d+)\s*x?\s+)?(.+?)(?:\s+\([A-Z0-9]{2,8}\)\s+[A-Z0-9*\-]+)?$/i);
    if (!match) continue;
    const quantity = Number.parseInt(match[1] || '1', 10);
    const name = match[2]?.trim();
    if (!name || !Number.isSafeInteger(quantity) || quantity < 1) continue;
    const key = name.toLowerCase();
    const existing = cards.get(key);
    if (existing) existing.quantity += quantity;
    else cards.set(key, { name, quantity, deckQuantity: 0, colors: [] });
  }
  return Array.from(cards.values());
}

export function validateLimitedWorkspace(value: unknown): value is LimitedWorkspace {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Partial<LimitedWorkspace>;
  if (candidate.version !== 1 || !['sealed', 'draft'].includes(String(candidate.mode)) || !Array.isArray(candidate.pool) || !candidate.basicLands || typeof candidate.basicLands !== 'object') return false;
  if (!COLORS.every((color) => Number.isSafeInteger(candidate.basicLands?.[color]) && Number(candidate.basicLands?.[color]) >= 0 && Number(candidate.basicLands?.[color]) <= 99)) return false;
  return candidate.pool.length <= 10000 && candidate.pool.every((card) => Boolean(card) && typeof card.name === 'string' && card.name.trim().length > 0 && card.name.length <= 300
    && Number.isSafeInteger(card.quantity) && card.quantity > 0 && Number.isSafeInteger(card.deckQuantity) && card.deckQuantity >= 0 && card.deckQuantity <= card.quantity
    && Array.isArray(card.colors) && card.colors.every((color) => COLORS.includes(color)));
}

export function loadLimitedWorkspace(): LimitedWorkspace {
  if (typeof window === 'undefined') return { ...EMPTY_LIMITED_WORKSPACE, basicLands: { ...EMPTY_LIMITED_WORKSPACE.basicLands } };
  try {
    const raw = window.localStorage.getItem(LIMITED_WORKSPACE_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return validateLimitedWorkspace(parsed) ? parsed : { ...EMPTY_LIMITED_WORKSPACE, basicLands: { ...EMPTY_LIMITED_WORKSPACE.basicLands } };
  } catch { return { ...EMPTY_LIMITED_WORKSPACE, basicLands: { ...EMPTY_LIMITED_WORKSPACE.basicLands } }; }
}

export function saveLimitedWorkspace(value: LimitedWorkspace) {
  if (typeof window !== 'undefined' && validateLimitedWorkspace(value)) window.localStorage.setItem(LIMITED_WORKSPACE_STORAGE_KEY, JSON.stringify(value));
}

export function setLimitedDeckQuantity(workspace: LimitedWorkspace, cardName: string, quantity: number): LimitedWorkspace {
  const nextQuantity = Math.max(0, Math.floor(quantity));
  return { ...workspace, pool: workspace.pool.map((card) => card.name.toLowerCase() === cardName.toLowerCase() ? { ...card, deckQuantity: Math.min(card.quantity, nextQuantity) } : card) };
}

export function limitedDeckTotal(workspace: LimitedWorkspace) {
  return workspace.pool.reduce((sum, card) => sum + card.deckQuantity, 0)
    + COLORS.reduce((sum, color) => sum + workspace.basicLands[color], 0);
}

export function formatLimitedDeck(workspace: LimitedWorkspace): string {
  const lines = workspace.pool.filter((card) => card.deckQuantity > 0).map((card) => `${card.deckQuantity} ${card.name}`);
  for (const color of COLORS) if (workspace.basicLands[color] > 0) lines.push(`${workspace.basicLands[color]} ${({ W: 'Plains', U: 'Island', B: 'Swamp', R: 'Mountain', G: 'Forest' } as const)[color]}`);
  return lines.join('\n');
}
