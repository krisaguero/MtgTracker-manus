/* Design reminder: hard-edged Dupe-Decks engine; parses inventory exports, matches duplicate card coverage, builds 60-card 1v1 duel decks around themes, and calls Groq proxy or local heuristic fallback. */

export interface InventoryCard {
  name: string;
  quantity: number;
  set?: string;
  rarity?: string;
}

export interface DupeDeckCard {
  name: string;
  quantity: number;
  type: 'Creature' | 'Instant' | 'Sorcery' | 'Artifact' | 'Enchantment' | 'Land';
  ownedCount: number;
  isCovered: boolean; // owned >= quantity needed
}

export interface DupeDeckResult {
  title: string;
  theme: string;
  archetype: 'Aggro' | 'Control' | 'Midrange' | 'Tempo' | 'Combo';
  description: string;
  colors: ('W' | 'U' | 'B' | 'R' | 'G')[];
  cards: DupeDeckCard[];
  totalCards: number;
  coveragePercent: number;
  groqPowered: boolean;
}

export const DUPE_DECK_THEMES = [
  { id: 'artifact-aggro', name: 'Artifact Aggro & Thopters', colors: ['W', 'R'], archetype: 'Aggro', desc: 'Fast artifacts, metalcraft payoffs, and aggressive token swarms.' },
  { id: 'graveyard-reanimator', name: 'Golgari Graveyard Dredge', colors: ['B', 'G'], archetype: 'Midrange', desc: 'Self-mill, reanimation targets, and recursive value creatures.' },
  { id: 'counter-burn-tempo', name: 'Izzet Spellslinger & Burn', colors: ['U', 'R'], archetype: 'Tempo', desc: 'Instant-speed interaction, prowess threats, and lethal burn spells.' },
  { id: 'lifegain-midrange', name: 'Orzhov Lifegain & Drain', colors: ['W', 'B'], archetype: 'Midrange', desc: 'Consistent life gain triggers, blood artist drains, and resilient threats.' },
  { id: 'ramp-stompy', name: 'Simic Ramp & Sea Monsters', colors: ['G', 'U'], archetype: 'Combo', desc: 'Mana dorks, extra card draw, and devastating top-end finishers.' },
];

export function loadGroqApiKey(): string {
  try {
    return window.localStorage.getItem('mtg-groq-api-key') || '';
  } catch {
    return '';
  }
}

export function saveGroqApiKey(key: string) {
  try {
    window.localStorage.setItem('mtg-groq-api-key', key.trim());
  } catch {
    // ignore
  }
}

// Helper to parse pasted inventory CSV / ManaBox / Arena list
export function parseInventoryText(text: string): InventoryCard[] {
  const lines = text.split(/\r?\n/);
  const inventory: InventoryCard[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^(\d+)?[xX]?\s+(.+?)(?:\s+\([A-Z0-9]+\)\s+\d+)?$/);
    if (match) {
      const qty = match[1] ? parseInt(match[1], 10) : 1;
      const name = match[2].trim().replace(/\s*\([A-Z0-9]+\).*$/, '');
      if (name) {
        inventory.push({ name, quantity: qty });
      }
    } else {
      inventory.push({ name: trimmed, quantity: 1 });
    }
  }

  return inventory;
}

export async function generateCustomGroqDeck(prompt: string, inventory: InventoryCard[], apiKey: string): Promise<DupeDeckResult> {
  if (!apiKey) {
    return generateDupeDeck('artifact-aggro', inventory);
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Magic: The Gathering deck builder. Generate a 60-card 1v1 duel deck list based on the user prompt. Return ONLY valid JSON in this exact shape: {"title": string, "theme": string, "archetype": "Aggro"|"Control"|"Midrange"|"Tempo"|"Combo", "description": string, "colors": ["W"|"U"|"B"|"R"|"G"], "cards": [{"name": string, "quantity": number, "type": "Creature"|"Instant"|"Sorcery"|"Artifact"|"Enchantment"|"Land"}]}. Total cards across all items must equal exactly 60.'
          },
          {
            role: 'user',
            content: `Create a 60-card deck for theme/prompt: "${prompt}". Available inventory size: ${inventory.reduce((s, i) => s + i.quantity, 0)} cards.`
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      throw new Error('Groq API request failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);

    const inventoryMap = new Map<string, number>();
    for (const item of inventory) {
      inventoryMap.set(item.name.toLowerCase(), (inventoryMap.get(item.name.toLowerCase()) || 0) + item.quantity);
    }

    const cards: DupeDeckCard[] = (parsed.cards || []).map((item: any) => {
      const name = item.name || 'Unknown Card';
      const quantity = Number(item.quantity) || 1;
      const type = item.type || 'Creature';
      const owned = inventoryMap.get(name.toLowerCase()) || 0;
      const isCovered = owned >= quantity;
      return {
        name,
        quantity,
        type,
        ownedCount: owned,
        isCovered,
      };
    });

    const totalCards = cards.reduce((sum, item) => sum + item.quantity, 0);
    const coveragePercent = totalCards > 0 ? Math.round((cards.reduce((sum, item) => sum + Math.min(item.quantity, item.ownedCount), 0) / totalCards) * 100) : 0;

    return {
      title: parsed.title || `${prompt} (Groq Custom)`,
      theme: parsed.theme || prompt,
      archetype: parsed.archetype || 'Midrange',
      description: parsed.description || 'Custom 60-card duel deck generated via Groq AI.',
      colors: parsed.colors || ['W', 'U'],
      cards,
      totalCards,
      coveragePercent,
      groqPowered: true,
    };
  } catch (err) {
    console.error('Groq generation error, falling back to local heuristic deck:', err);
    return generateDupeDeck('artifact-aggro', inventory);
  }
}

export function generateDupeDeck(themeId: string, inventory: InventoryCard[]): DupeDeckResult {
  const theme = DUPE_DECK_THEMES.find((t) => t.id === themeId) || DUPE_DECK_THEMES[0];
  const inventoryMap = new Map<string, number>();
  for (const item of inventory) {
    inventoryMap.set(item.name.toLowerCase(), (inventoryMap.get(item.name.toLowerCase()) || 0) + item.quantity);
  }

  let rawList: Array<{ name: string; quantity: number; type: DupeDeckCard['type'] }> = [];

  if (themeId === 'artifact-aggro') {
    rawList = [
      { name: 'Thraben Inspector', quantity: 4, type: 'Creature' },
      { name: 'Artifact Worker', quantity: 4, type: 'Creature' },
      { name: 'Signal Pest', quantity: 4, type: 'Creature' },
      { name: 'Galvanic Blast', quantity: 4, type: 'Instant' },
      { name: 'Thoughtcast', quantity: 3, type: 'Sorcery' },
      { name: 'Procession Kithkin', quantity: 4, type: 'Artifact' },
      { name: 'Bonesplitter', quantity: 3, type: 'Artifact' },
      { name: 'Lightning Bolt', quantity: 4, type: 'Instant' },
      { name: 'Artifact Citadel', quantity: 4, type: 'Land' },
      { name: 'Mountain', quantity: 10, type: 'Land' },
      { name: 'Plains', quantity: 10, type: 'Land' },
    ];
  } else if (themeId === 'graveyard-reanimator') {
    rawList = [
      { name: 'Stitcher\'s Supplier', quantity: 4, type: 'Creature' },
      { name: 'Grisly Salvage', quantity: 4, type: 'Instant' },
      { name: 'Satyr Wayfinder', quantity: 4, type: 'Creature' },
      { name: 'Tarmogoyf', quantity: 3, type: 'Creature' },
      { name: 'Necromancy', quantity: 3, type: 'Enchantment' },
      { name: 'Colossal Dreadmaw', quantity: 2, type: 'Creature' },
      { name: 'Deadly Dispute', quantity: 4, type: 'Instant' },
      { name: 'Overgrown Tomb', quantity: 4, type: 'Land' },
      { name: 'Swamp', quantity: 10, type: 'Land' },
      { name: 'Forest', quantity: 12, type: 'Land' },
    ];
  } else if (themeId === 'counter-burn-tempo') {
    rawList = [
      { name: 'Delver of Secrets', quantity: 4, type: 'Creature' },
      { name: 'Monastery Swiftspear', quantity: 4, type: 'Creature' },
      { name: 'Lightning Bolt', quantity: 4, type: 'Instant' },
      { name: 'Consider', quantity: 4, type: 'Instant' },
      { name: 'Counterspell', quantity: 4, type: 'Instant' },
      { name: 'Preordain', quantity: 3, type: 'Sorcery' },
      { name: 'Play with Fire', quantity: 3, type: 'Instant' },
      { name: 'Steam Vents', quantity: 4, type: 'Land' },
      { name: 'Island', quantity: 10, type: 'Land' },
      { name: 'Mountain', quantity: 10, type: 'Land' },
    ];
  } else if (themeId === 'lifegain-midrange') {
    rawList = [
      { name: 'Soul Warden', quantity: 4, type: 'Creature' },
      { name: 'Ajani\'s Pridemate', quantity: 4, type: 'Creature' },
      { name: 'Viscera Seer', quantity: 3, type: 'Creature' },
      { name: 'Blood Artist', quantity: 4, type: 'Creature' },
      { name: 'Fatal Push', quantity: 4, type: 'Instant' },
      { name: 'Night\'s Whisper', quantity: 3, type: 'Sorcery' },
      { name: 'Godless Shrine', quantity: 4, type: 'Land' },
      { name: 'Plains', quantity: 12, type: 'Land' },
      { name: 'Swamp', quantity: 12, type: 'Land' },
    ];
  } else {
    rawList = [
      { name: 'Llanowar Elves', quantity: 4, type: 'Creature' },
      { name: 'Arbor Elf', quantity: 4, type: 'Creature' },
      { name: 'Growth Spiral', quantity: 4, type: 'Instant' },
      { name: 'Cultivate', quantity: 3, type: 'Sorcery' },
      { name: 'Beast Within', quantity: 3, type: 'Instant' },
      { name: 'Uro, Titan of Nature\'s Wrath', quantity: 2, type: 'Creature' },
      { name: 'Breeding Pool', quantity: 4, type: 'Land' },
      { name: 'Forest', quantity: 14, type: 'Land' },
      { name: 'Island', quantity: 12, type: 'Land' },
    ];
  }

  let total = rawList.reduce((sum, item) => sum + item.quantity, 0);
  if (total < 60 && rawList.length > 0) {
    rawList[0].quantity += 60 - total;
  } else if (total > 60) {
    rawList[rawList.length - 1].quantity -= total - 60;
  }

  let coveredCount = 0;
  const cards: DupeDeckCard[] = rawList.map((item) => {
    const owned = inventoryMap.get(item.name.toLowerCase()) || 0;
    const isCovered = owned >= item.quantity;
    if (isCovered) coveredCount += item.quantity;
    return {
      name: item.name,
      quantity: item.quantity,
      type: item.type,
      ownedCount: owned,
      isCovered,
    };
  });

  const totalCards = cards.reduce((sum, item) => sum + item.quantity, 0);
  const coveragePercent = Math.round((cards.reduce((sum, item) => sum + Math.min(item.quantity, item.ownedCount), 0) / totalCards) * 100);

  return {
    title: `${theme.name} (Dupe-Deck)`,
    theme: theme.name,
    archetype: theme.archetype as any,
    description: theme.desc,
    colors: theme.colors as any,
    cards,
    totalCards,
    coveragePercent,
    groqPowered: false,
  };
}
