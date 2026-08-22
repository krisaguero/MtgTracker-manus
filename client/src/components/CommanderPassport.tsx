import React, { useState, useEffect } from 'react';
import { Crown, Plus, Trash2, Shield, Sparkles, ExternalLink, Check, Edit3, Save, X, Trophy } from 'lucide-react';
import { CardImageZoom } from '@/components/CardImageZoom';

export interface CommanderPassportDeck {
  id: string;
  commanderName: string;
  deckName: string;
  colors: string[];
  theme: string;
  status: 'Active' | 'Built & Ready' | 'Tuning' | 'Retired';
  wins?: number;
  notes?: string;
  addedAt: number;
}

const STORAGE_KEY = 'mtg_tracker_commander_passport_v1';

const INITIAL_COMMANDERS: CommanderPassportDeck[] = [
  {
    id: 'deck-1',
    commanderName: 'Queen Marchesa',
    deckName: 'Marchesa Long Play (Mardu Control)',
    colors: ['W', 'B', 'R'],
    theme: 'The Monarch, Board Wipes & Assassins',
    status: 'Active',
    wins: 14,
    notes: 'Primary competitive/casual control deck utilizing the monarch and proactive removal.',
    addedAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'deck-2',
    commanderName: 'Alesha, Who Smiles at Death',
    deckName: 'Alesha Low-to-the-Ground Reanimator',
    colors: ['W', 'B', 'R'],
    theme: 'Small Creature Reanimation & Attack Triggers',
    status: 'Active',
    wins: 19,
    notes: 'Fast-paced Mardu aggro-reanimator bringing back utility beaters every combat.',
    addedAt: Date.now() - 86400000 * 20,
  },
];

export function CommanderPassport() {
  const [decks, setDecks] = useState<CommanderPassportDeck[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_COMMANDERS;
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state for adding/editing
  const [commanderName, setCommanderName] = useState('');
  const [deckName, setDeckName] = useState('');
  const [colors, setColors] = useState<string[]>(['W', 'B']);
  const [theme, setTheme] = useState('');
  const [status, setStatus] = useState<'Active' | 'Built & Ready' | 'Tuning' | 'Retired'>('Active');
  const [wins, setWins] = useState<number>(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    } catch {}
  }, [decks]);

  const handleAddDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commanderName.trim()) return;

    if (editingId) {
      setDecks(
        decks.map((d) =>
          d.id === editingId
            ? {
                ...d,
                commanderName: commanderName.trim(),
                deckName: deckName.trim() || `${commanderName.trim()} EDH`,
                colors,
                theme: theme.trim() || d.theme,
                status,
                wins: Number(wins) || 0,
                notes: notes.trim(),
              }
            : d
        )
      );
      setEditingId(null);
    } else {
      const newDeck: CommanderPassportDeck = {
        id: `deck-${Date.now()}`,
        commanderName: commanderName.trim(),
        deckName: deckName.trim() || `${commanderName.trim()} EDH`,
        colors,
        theme: theme.trim() || 'Custom Commander Synergy',
        status,
        wins: Number(wins) || 0,
        notes: notes.trim(),
        addedAt: Date.now(),
      };
      setDecks([newDeck, ...decks]);
    }

    setCommanderName('');
    setDeckName('');
    setTheme('');
    setWins(0);
    setNotes('');
    setIsAdding(false);
  };

  const startEdit = (deck: CommanderPassportDeck) => {
    setEditingId(deck.id);
    setCommanderName(deck.commanderName);
    setDeckName(deck.deckName);
    setColors(deck.colors || ['W']);
    setTheme(deck.theme);
    setStatus(deck.status);
    setWins(deck.wins || 0);
    setNotes(deck.notes || '');
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    setDecks(decks.filter((d) => d.id !== id));
  };

  const toggleColor = (c: string) => {
    setColors(colors.includes(c) ? colors.filter((x) => x !== c) : [...colors, c]);
  };

  const incrementWins = (id: string) => {
    setDecks(
      decks.map((d) => (d.id === id ? { ...d, wins: (d.wins || 0) + 1 } : d))
    );
  };

  return (
    <section className="my-10 border-2 border-border bg-card p-6 sm:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-border pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <Crown className="h-4 w-4" /> Commander Passport · Active &amp; Built Deck Roster
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">Active Command Zone</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track the legendary commanders you are currently piloting at the table (featuring Queen Marchesa and Alesha), plus any newly built decks ready for rotation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isAdding) {
              setIsAdding(false);
              setEditingId(null);
            } else {
              setEditingId(null);
              setCommanderName('');
              setDeckName('');
              setTheme('');
              setWins(0);
              setNotes('');
              setIsAdding(true);
            }
          }}
          className="border-2 border-primary bg-primary text-primary-foreground px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90 inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> {isAdding ? 'Close Form' : 'Register New Commander'}
        </button>
      </div>

      {/* Add / Edit Deck Form */}
      {isAdding && (
        <form onSubmit={handleAddDeck} className="my-6 border-2 border-primary/40 bg-primary/5 p-6 space-y-4">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
            {editingId ? 'Edit Commander Passport Deck' : 'Add Deck to Passport'}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs text-muted-foreground uppercase mb-1">Commander Name *</label>
              <input
                type="text"
                required
                value={commanderName}
                onChange={(e) => setCommanderName(e.target.value)}
                placeholder="e.g. Yuriko, the Tiger's Shadow"
                className="w-full bg-background border border-border px-3 py-2 font-mono text-xs uppercase focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-muted-foreground uppercase mb-1">Deck / Strategy Title</label>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="e.g. Dimir Tempo Ninjas"
                className="w-full bg-background border border-border px-3 py-2 font-mono text-xs uppercase focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-mono text-xs text-muted-foreground uppercase mb-1">Color Identity</label>
              <div className="flex gap-1.5 pt-1">
                {['W', 'U', 'B', 'R', 'G'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleColor(c)}
                    className={`h-7 w-7 border font-mono text-xs font-bold ${
                      colors.includes(c) ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs text-muted-foreground uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-background border border-border px-3 py-2 font-mono text-xs uppercase focus:border-primary focus:outline-none"
              >
                <option value="Active">Active (Main Rotation)</option>
                <option value="Built & Ready">Built &amp; Ready</option>
                <option value="Tuning">Tuning / In Progress</option>
                <option value="Retired">Retired / Vaulted</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-xs text-muted-foreground uppercase mb-1">Recorded Wins</label>
              <input
                type="number"
                min="0"
                value={wins}
                onChange={(e) => setWins(parseInt(e.target.value) || 0)}
                className="w-full bg-background border border-border px-3 py-2 font-mono text-xs focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-muted-foreground uppercase mb-1">Archetype / Theme</label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Control / Artifacts"
                className="w-full bg-background border border-border px-3 py-2 font-mono text-xs uppercase focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs text-muted-foreground uppercase mb-1">Battlefield Notes &amp; Strategy</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key cards, win cons, or sideboard options..."
              rows={2}
              className="w-full bg-background border border-border px-3 py-2 font-mono text-xs focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="border border-border bg-background px-4 py-2 font-mono text-xs uppercase hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="border border-primary bg-primary text-primary-foreground px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90 inline-flex items-center gap-1.5"
            >
              <Save className="h-3.5 w-3.5" /> {editingId ? 'Update Passport' : 'Save to Passport'}
            </button>
          </div>
        </form>
      )}

      {/* Decks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {decks.map((deck) => {
          const scryfallArtUrl = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(deck.commanderName)}&format=image&version=art_crop`;

          return (
            <div key={deck.id} className="border-2 border-border bg-background flex flex-col justify-between p-5 group hover:border-primary transition-colors">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden border-2 border-border bg-muted">
                      <CardImageZoom
                        src={scryfallArtUrl}
                        fallbackSrc={`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(deck.commanderName)}&format=image&version=normal`}
                        alt={deck.commanderName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase font-bold text-primary tracking-widest">{deck.status}</span>
                      <h3 className="text-base font-extrabold tracking-tight mt-0.5">{deck.commanderName}</h3>
                      <p className="font-mono text-xs text-muted-foreground">{deck.deckName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEdit(deck)}
                      title="Edit Passport Deck"
                      className="border border-border bg-muted p-1.5 text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(deck.id)}
                      title="Delete Deck"
                      className="border border-border bg-muted p-1.5 text-muted-foreground hover:text-red-500 hover:border-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mt-4 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Colors:</span>
                    <span className="font-bold tracking-wider">{deck.colors.join(' ')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Theme:</span>
                    <span className="font-medium text-foreground">{deck.theme}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Recorded Wins:</span>
                    <button
                      type="button"
                      onClick={() => incrementWins(deck.id)}
                      className="inline-flex items-center gap-1.5 border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-amber-500 hover:bg-amber-500/20 font-bold"
                      title="Click to record a win (+1)"
                    >
                      <Trophy className="h-3 w-3" /> {deck.wins || 0} Wins (+1)
                    </button>
                  </div>
                </div>

                {deck.notes && (
                  <div className="mt-4 bg-muted/50 border border-border p-3 font-mono text-xs text-muted-foreground leading-relaxed">
                    {deck.notes}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                <span>Added: {new Date(deck.addedAt).toLocaleDateString()}</span>
                <a
                  href={`https://scryfall.com/search?q=${encodeURIComponent(deck.commanderName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Scryfall Lookup <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
