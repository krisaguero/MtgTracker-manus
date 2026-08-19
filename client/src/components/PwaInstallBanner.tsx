// Design philosophy: hard-edged utility guidance that appears only when it is actionable, never blocking the card archive or mobile zoom interactions.
import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

const DISMISS_KEY = 'mtg-tracker-ios-pwa-dismissed';

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

function isIosDevice() {
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((window.navigator as NavigatorWithStandalone).standalone);
}

export function PwaInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isIosDevice() && !isStandalone() && window.localStorage.getItem(DISMISS_KEY) !== '1') setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  return <aside className="fixed inset-x-3 bottom-3 z-[80] border-2 border-primary bg-background p-4 text-foreground shadow-[8px_8px_0_rgba(20,20,30,0.18)] sm:inset-x-auto sm:right-5 sm:w-[23rem]" aria-label="Install MTG Sets Tracker on iPhone or iPad">
    <div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary text-primary-foreground"><Download className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Keep it on your shelf</p><h2 className="mt-1 font-bold">Add this tracker to your Home Screen.</h2></div><button type="button" onClick={dismiss} className="shrink-0 border border-border p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Dismiss install reminder"><X className="h-4 w-4" /></button></div><p className="mt-2 text-sm leading-relaxed text-muted-foreground">In Safari, tap <Share className="mx-0.5 inline h-3.5 w-3.5 text-primary" /> <strong className="text-foreground">Share</strong>, choose <strong className="text-foreground">Add to Home Screen</strong>, then open the tracker like an app.</p><button type="button" onClick={dismiss} className="mt-3 border border-primary px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground">Got it</button></div></div>
  </aside>;
}
