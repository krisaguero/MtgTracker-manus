import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Layers3 } from 'lucide-react';

interface PreconStickyHeaderProps {
  deckName: string;
  approxValue: number;
  ownedApproxValue: number;
  commanderCards: Array<{ name: string; count?: number; set_code?: string }>;
  mainCards: Array<{ name: string; count?: number; set_code?: string }>;
}

export function PreconStickyHeader({ deckName, approxValue, ownedApproxValue }: PreconStickyHeaderProps) {
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowSticky(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!showSticky) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 border-b-2 border-primary bg-card/95 backdrop-blur-md px-4 py-3 shadow-lg transition-all animate-in fade-in slide-in-from-top duration-200">
      <div className="container flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Layers3 className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <h3 className="font-bold truncate text-sm sm:text-base">{deckName}</h3>
            <p className="font-mono text-[10px] text-muted-foreground uppercase">
              Market Value: <strong className="text-primary">${approxValue}</strong> · Owned Value: <strong className="text-emerald-500">${ownedApproxValue}</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="font-mono text-xs uppercase">
            Back to Top
          </Button>
        </div>
      </div>
    </div>
  );
}
