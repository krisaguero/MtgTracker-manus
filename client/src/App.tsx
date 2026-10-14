import { lazy, Suspense, useEffect, useLayoutEffect } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, useLocation } from 'wouter';
import ErrorBoundary from './components/ErrorBoundary';
import { InternalPageNav } from './components/InternalPageNav';
import { ThemeProvider } from './contexts/ThemeContext';
import { PwaInstallBanner } from '@/components/PwaInstallBanner';
import { Toaster } from '@/components/ui/sonner';

const NotFound = lazy(() => import('@/pages/NotFound'));
const Home = lazy(() => import('./pages/Home'));
const SetDetail = lazy(() => import('./pages/SetDetail'));
const CommanderDeck = lazy(() => import('./pages/CommanderDeck'));
const PreconCatalog = lazy(() => import('@/pages/PreconCatalog'));
const CommanderLibrary = lazy(() => import('@/pages/CommanderLibrary'));
const CommanderPreconLibrary = lazy(() => import('@/pages/CommanderPreconLibrary'));
const CommanderMarketIndex = lazy(() => import('@/pages/CommanderMarketIndex'));
const Collection = lazy(() => import('@/pages/Collection'));
const MarketReport = lazy(() => import('@/pages/MarketReport'));
const LatestMarketReport = lazy(() => import('@/pages/LatestMarketReport'));
const MarketReportArchive = lazy(() => import('@/pages/MarketReportArchive'));
const MarketSignalAudit = lazy(() => import('@/pages/MarketSignalAudit'));
const DailyMovers = lazy(() => import('@/pages/DailyMovers').then((module) => ({ default: module.DailyMovers })));
const MarketWatchArticle = lazy(() => import('@/pages/MarketWatchArticle').then((module) => ({ default: module.MarketWatchArticle })));
const FeaturedSignalMatrixArticle = lazy(() => import('@/pages/FeaturedSignalMatrixArticle').then((module) => ({ default: module.FeaturedSignalMatrixArticle })));
const MarketMoverArticle = lazy(() => import('@/pages/MarketMoverArticle'));
const CostcoDealArticle = lazy(() => import('@/pages/CostcoDealArticle'));
const DupeDecks = lazy(() => import('@/pages/DupeDecks').then((module) => ({ default: module.DupeDecks })));
const DuelBattleBoxArticle = lazy(() => import('@/pages/DuelBattleBoxArticle'));
const CardDetail = lazy(() => import('@/pages/CardDetail'));
const EditorialMarketArticles = lazy(() => import('@/pages/EditorialMarketArticles'));
const EditorialMarketArticle = lazy(() => import('@/pages/EditorialMarketArticle'));
const TodayMarketBrief = lazy(() => import('@/pages/TodayMarketBrief'));
const SpoilerCalendar = lazy(() => import('@/pages/SpoilerCalendar'));
const MarketMoverReportArticle = lazy(() => import('@/pages/MarketMoverReportArticle'));
const MarketMoverDashboards = lazy(() => import('@/pages/MarketMoverDashboards'));
const MarketResearchFeed = lazy(() => import('@/pages/MarketResearchFeed'));

function Router() {
  return (
    <Suspense fallback={<div className="container flex min-h-[40vh] items-center justify-center py-12" role="status" aria-live="polite">Loading page…</div>}>
      <Switch>
        <Route path={'/'} component={Home} />
        <Route path={'/commander'} component={CommanderLibrary} />
        <Route path={'/precons'} component={CommanderPreconLibrary} />
        <Route path={'/commander-market'} component={CommanderMarketIndex} />
        <Route path={'/collection'} component={Collection} />
        <Route path="/market-report" component={MarketReport} />
        <Route path="/dupe-decks" component={DupeDecks} />
        <Route path="/duel-battle-box" component={DuelBattleBoxArticle} />
        <Route path="/latest-market-report" component={LatestMarketReport} />
        <Route path="/market-reports" component={MarketReportArchive} />
        <Route path="/market-today" component={TodayMarketBrief} />
        <Route path="/spoiler-calendar" component={SpoilerCalendar} />
        <Route path="/market-report/:dateKey" component={MarketReportArchive} />
        <Route path="/market-signal-audit" component={MarketSignalAudit} />
        <Route path="/market-movers-manus-report" component={MarketMoverReportArticle} />
        <Route path="/movers/:dashboard" component={MarketMoverDashboards} />
        <Route path="/movers" component={DailyMovers} />
        <Route path="/market-articles" component={EditorialMarketArticles} />
        <Route path="/market-category/:slug" component={EditorialMarketArticle} />
        <Route path="/market-watch-article" component={MarketWatchArticle} />
        <Route path="/market-watch" component={MarketResearchFeed} />
        <Route path="/signal-matrix-article" component={FeaturedSignalMatrixArticle} />
        <Route path="/market-mover/:moverSlug" component={MarketMoverArticle} />
        <Route path="/costco-deal-article" component={CostcoDealArticle} />
        <Route path={'/deck/:setCode/:deckSlug'} component={CommanderDeck} />
        <Route path={'/precon/:setCode/:deckSlug'} component={PreconCatalog} />
        <Route path={'/:setCode'} component={SetDetail} />
        <Route path={'/card/:cardName'} component={CardDetail} />
        <Route path={'/404'} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function RouteScrollReset() {
  const [location] = useLocation();

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previousRestoration; };
  }, []);

  useLayoutEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const frame = window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
      return () => window.cancelAnimationFrame(frame);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <InternalPageNav />
          <RouteScrollReset />
          <Router />
          <PwaInstallBanner />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
