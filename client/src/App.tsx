import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SetDetail from "./pages/SetDetail";
import CommanderDeck from "./pages/CommanderDeck";
import PreconCatalog from "@/pages/PreconCatalog";
import CommanderLibrary from "@/pages/CommanderLibrary";
import CommanderPreconLibrary from "@/pages/CommanderPreconLibrary";
import Collection from "@/pages/Collection";
import MarketReport from '@/pages/MarketReport';
import { DailyMovers } from '@/pages/DailyMovers';
import { MarketWatchArticle } from '@/pages/MarketWatchArticle';
import { FeaturedSignalMatrixArticle } from '@/pages/FeaturedSignalMatrixArticle';
import CostcoDealArticle from '@/pages/CostcoDealArticle';
import { DupeDecks } from '@/pages/DupeDecks';
import CardDetail from '@/pages/CardDetail';
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { Toaster } from "@/components/ui/sonner";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/commander"} component={CommanderLibrary} />
      <Route path={"/precons"} component={CommanderPreconLibrary} />
      <Route path={"/collection"} component={Collection} />
      <Route path="/market-report" component={MarketReport} />
      <Route path="/movers" component={DailyMovers} />
      <Route path="/market-watch-article" component={MarketWatchArticle} />
      <Route path="/signal-matrix-article" component={FeaturedSignalMatrixArticle} />
      <Route path="/costco-deal-article" component={CostcoDealArticle} />
      <Route path={"/deck/:setCode/:deckSlug"} component={CommanderDeck} />
      <Route path={"/precon/:setCode/:deckSlug"} component={PreconCatalog} />
      <Route path={"/:setCode"} component={SetDetail} />
      <Route path={"/card/:cardName"} component={CardDetail} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <PwaInstallBanner />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
