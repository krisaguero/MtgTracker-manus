import { Toaster } from "@/components/ui/sonner";
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
import Collection from "@/pages/Collection";
import { MarketReport } from '@/pages/MarketReport';
import { DailyMovers } from '@/pages/DailyMovers';
import { DailyPost } from '@/pages/DailyPost';
import { DupeDecks } from '@/pages/DupeDecks';
import { PwaInstallBanner } from "@/components/PwaInstallBanner";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/commander"} component={CommanderLibrary} />
      <Route path={"/collection"} component={Collection} />
      <Route path="/movers/post" component={DailyPost} />
      <Route path="/movers" component={DailyMovers} />
      <Route path="/dupe-decks" component={DupeDecks} />
      <Route path={"/movers/post"} component={DailyPost} />
      <Route path={"/deck/:setCode/:deckSlug"} component={CommanderDeck} />
      <Route path={"/precon/:setCode/:deckSlug"} component={PreconCatalog} />
      <Route path={"/:setCode"} component={SetDetail} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
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
