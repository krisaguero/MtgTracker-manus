/* Design reminder: hard-edged Dupe-Decks workspace; 60-card 1v1 duel deck builder powered by duplicate inventory matching and Groq-assisted theming. */
import { useState, useMemo, useRef } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, CheckCircle2, Copy, Download, FileUp, Key, Layers, Loader2, ShieldAlert, Sparkles, Upload, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DUPE_DECK_THEMES, generateCustomGroqDeck, generateDupeDeck, loadGroqApiKey, parseInventoryText, saveGroqApiKey, type InventoryCard, type DupeDeckResult } from '@/lib/dupeDecksEngine';
import { loadSavedInventory, saveSavedInventory } from '@/lib/dupeDecksStorage';

export function DupeDecks() {
  const [activeDeckSlot, setActiveDeckSlot] = useState<'a' | 'b'>('a');
  const [inventoryA, setInventoryA] = useState<string>(() => loadSavedInventory('a'));
  const [inventoryB, setInventoryB] = useState<string>(() => loadSavedInventory('b'));

  const inventoryInput = activeDeckSlot === 'a' ? inventoryA : inventoryB;
  const setInventoryInput = (val: string) => {
    if (activeDeckSlot === 'a') {
      setInventoryA(val);
      saveSavedInventory('a', val);
    } else {
      setInventoryB(val);
      saveSavedInventory('b', val);
    }
  };

  const [selectedTheme, setSelectedTheme] = useState<string>('counter-burn-tempo');
  const [inventory, setInventory] = useState<InventoryCard[]>(() => parseInventoryText(inventoryInput));
  const [deck, setDeck] = useState<DupeDeckResult>(() => generateDupeDeck(selectedTheme, inventory));
  const [copied, setCopied] = useState(false);

  const fileInputRefA = useRef<HTMLInputElement>(null);
  const fileInputRefB = useRef<HTMLInputElement>(null);

  const [apiKey, setApiKey] = useState<string>(() => loadGroqApiKey());
  const [customPrompt, setCustomPrompt] = useState<string>('Izzet Prowess Spellslinger 1v1 duel deck');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  function handleBuildDeck(themeId: string) {
    setSelectedTheme(themeId);
    const parsed = parseInventoryText(inventoryInput);
    setInventory(parsed);
    setDeck(generateDupeDeck(themeId, parsed));
  }

  function handleUpdateInventory(val: string) {
    setInventoryInput(val);
    const parsed = parseInventoryText(val);
    setInventory(parsed);
    setDeck(generateDupeDeck(selectedTheme, parsed));
  }

  function handleSwitchSlot(slot: 'a' | 'b') {
    setActiveDeckSlot(slot);
    const text = slot === 'a' ? inventoryA : inventoryB;
    const parsed = parseInventoryText(text);
    setInventory(parsed);
    setDeck(generateDupeDeck(selectedTheme, parsed));
  }

  function handleFileUpload(slot: 'a' | 'b', event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        if (slot === 'a') {
          setInventoryA(text);
          saveSavedInventory('a', text);
        } else {
          setInventoryB(text);
          saveSavedInventory('b', text);
        }
        if (activeDeckSlot === slot) {
          const parsed = parseInventoryText(text);
          setInventory(parsed);
          setDeck(generateDupeDeck(selectedTheme, parsed));
        }
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function handleMergeInventories() {
    const merged = `${inventoryA}\n${inventoryB}`;
    setInventoryInput(merged);
    const parsed = parseInventoryText(merged);
    setInventory(parsed);
    setDeck(generateDupeDeck(selectedTheme, parsed));
  }

  function handleSaveKey(val: string) {
    setApiKey(val);
    saveGroqApiKey(val);
  }

  async function handleGenerateCustom() {
    if (!apiKey.trim()) {
      setGenerationError('Please enter a Groq API key to generate custom AI archetypes.');
      return;
    }
    setGenerationError(null);
    setIsGenerating(true);
    try {
      const parsedInventory = parseInventoryText(inventoryInput);
      setInventory(parsedInventory);
      const result = await generateCustomGroqDeck(customPrompt, parsedInventory, apiKey.trim());
      setDeck(result);
      setSelectedTheme('custom');
    } catch (err: any) {
      setGenerationError(err?.message || 'Failed to generate custom deck via Groq.');
    } finally {
      setIsGenerating(false);
    }
  }

  const exportText = useMemo(() => {
    const lines: string[] = [];
    lines.push(`// Dupe-Decks 60-Card 1v1 Duel Deck: ${deck.title}`);
    lines.push(`// Theme: ${deck.theme} | Coverage: ${deck.coveragePercent}% owned from your inventory${deck.groqPowered ? ' (Groq AI)' : ''}`);
    lines.push('');
    for (const card of deck.cards) {
      lines.push(`${card.quantity} ${card.name}`);
    }
    return lines.join('\n');
  }, [deck]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  }

  function handleDownload() {
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${deck.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Recent Sets
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/market-report" className="border border-border bg-card px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-primary hover:text-primary">
              Market Report
            </Link>
            <Link href="/movers" className="border border-border bg-card px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-primary hover:text-primary">
              Daily Movers
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="border-b-2 border-primary pb-6 sm:pb-8">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <Layers className="h-4 w-4" /> 60-Card 1v1 Duel Builder + Groq AI
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">Dupe-Decks: Library &amp; Inventory Processor</h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg leading-relaxed">
            Import your card library or ManaBox inventory export to automatically build competitive 60-card 1v1 duel decks that maximize your existing duplicate card pool, enhanced by Groq AI.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left: Inventory Input, Groq Key, & Themes */}
          <div className="lg:col-span-5 space-y-8">
            <div className="border-2 border-border bg-card p-6">
              <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-primary">
                <Key className="h-4 w-4" /> Groq AI Integration
              </div>
              <h2 className="mt-2 text-xl font-bold">Configure Groq API Key</h2>
              <p className="mt-1 text-sm text-muted-foreground">Enter your Groq API key to enable custom AI archetype generation and smart inventory matching.</p>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => handleSaveKey(e.target.value)}
                placeholder="gsk_..."
                aria-label="Groq API Key"
                className="mt-4 w-full border border-border bg-background p-3 font-mono text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
              <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">Stored locally in your browser storage only.</p>

              <div className="mt-6 border-t border-border pt-5">
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-primary">Custom AI Prompt / Theme</label>
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Mono-Red Aggro Goblins"
                  aria-label="Custom AI Prompt or Theme"
                  className="mt-2 w-full border border-border bg-background p-2.5 font-mono text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
                <Button
                  onClick={handleGenerateCustom}
                  disabled={isGenerating}
                  className="mt-3 w-full gap-2 font-mono text-xs uppercase tracking-wider"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  {isGenerating ? 'Generating via Groq AI...' : 'Generate Custom AI Deck'}
                </Button>
                {generationError && <p className="mt-2 text-xs font-semibold text-destructive">{generationError}</p>}
              </div>
            </div>

            <div className="border-2 border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">1. Import Dual Inventories</h2>
                <div className="flex gap-1 border border-border bg-background p-1">
                  <button
                    type="button"
                    onClick={() => handleSwitchSlot('a')}
                    className={`px-3 py-1 font-mono text-xs font-bold uppercase transition-colors ${activeDeckSlot === 'a' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Deck A
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchSlot('b')}
                    className={`px-3 py-1 font-mono text-xs font-bold uppercase transition-colors ${activeDeckSlot === 'b' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Deck B
                  </button>
                </div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Manage and remember two separate inventory lists (e.g. Player A & Player B or two deck pools).</p>
              
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRefA}
                  type="file"
                  accept=".txt,.csv"
                  className="hidden"
                  onChange={(e) => handleFileUpload('a', e)}
                />
                <input
                  ref={fileInputRefB}
                  type="file"
                  accept=".txt,.csv"
                  className="hidden"
                  onChange={(e) => handleFileUpload('b', e)}
                />
                <Button
                  variant="outline"
                  onClick={() => (activeDeckSlot === 'a' ? fileInputRefA : fileInputRefB).current?.click()}
                  className="gap-2 font-mono text-xs uppercase"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload {activeDeckSlot === 'a' ? 'Deck A' : 'Deck B'} File
                </Button>
                <Button
                  variant="outline"
                  onClick={handleMergeInventories}
                  className="gap-2 font-mono text-xs uppercase"
                >
                  <FileUp className="h-3.5 w-3.5" /> Merge A + B
                </Button>
              </div>

              <textarea
                value={inventoryInput}
                onChange={(e) => handleUpdateInventory(e.target.value)}
                rows={6}
                aria-label={`Paste inventory card list for Deck ${activeDeckSlot.toUpperCase()}`}
                className="mt-4 w-full border border-border bg-background p-3 font-mono text-xs leading-5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                placeholder="4 Lightning Bolt&#10;4 Counterspell..."
              />
              <p className="mt-2 font-mono text-xs text-muted-foreground">Detected {inventory.length} unique inventory lines.</p>
            </div>

            <div className="border-2 border-border bg-card p-6">
              <h2 className="text-xl font-bold">2. Prebuilt 1v1 Duel Themes</h2>
              <p className="mt-1 text-sm text-muted-foreground">Or choose a classic 60-card archetype.</p>
              <div className="mt-4 space-y-3">
                {DUPE_DECK_THEMES.map((theme) => {
                  const isSelected = selectedTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => handleBuildDeck(theme.id)}
                      className={`w-full text-left border-2 p-4 transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-base">{theme.name}</h3>
                        <span className="border border-border bg-muted px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                          {theme.archetype}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{theme.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Generated Deck Preview & Coverage */}
          <div className="lg:col-span-7 space-y-8">
            <div className="border-2 border-primary bg-card p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-primary">
                    <Sparkles className="h-4 w-4" /> {deck.groqPowered ? 'Groq AI Powered' : 'Local Heuristic Engine'}
                  </div>
                  <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{deck.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{deck.description}</p>
                </div>
                <div className="border-2 border-border bg-background px-4 py-3 text-right">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Inventory Coverage</p>
                  <p className="text-2xl font-extrabold text-primary">{deck.coveragePercent}%</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider">
                  <span>Total Cards: {deck.totalCards}</span>
                  <span>·</span>
                  <span>Colors: {deck.colors.join(', ')}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="default" className="gap-2" onClick={handleCopy}>
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'List Copied' : 'Copy List'}
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handleDownload}>
                    <Download className="h-4 w-4" /> Download .txt
                  </Button>
                </div>
              </div>

              <div className="mt-6 space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {deck.cards.map((card) => (
                  <div key={card.name} className={`flex items-center justify-between border p-3 ${card.isCovered ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
                    <div className="flex items-center gap-3">
                      <span className="border border-border bg-background px-2 py-0.5 font-mono text-xs font-bold">{card.quantity}×</span>
                      <div>
                        <p className="font-bold text-sm">{card.name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase">{card.type}</p>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs">
                      {card.isCovered ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Owned ({card.ownedCount})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                          <ShieldAlert className="h-3.5 w-3.5" /> Need {card.quantity - card.ownedCount} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <textarea
                readOnly
                value={exportText}
                aria-label="Dupe-Decks Export Preview"
                className="mt-6 w-full resize-none border border-border bg-background p-3 font-mono text-xs leading-5 text-muted-foreground outline-none"
                rows={6}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
