# MTG Sets Tracker

A modern, minimalist Magic: The Gathering sets tracker that displays recent Magic sets and their associated Commander precons in chronological order. Built with React, Tailwind CSS, and the Scryfall API.

## Features

- **Live Scryfall Integration**: Fetches real-time data on recent Magic sets and precons
- **Chronological Timeline**: Sets displayed newest-first with a visual timeline
- **Hard-Edge Design**: Clean, professional interface with sharp geometric elements
- **Set Symbols**: Official set symbols from Scryfall displayed for each set
- **Commander Precons**: Shows each associated Commander precon as an individual deck entry with color identity
- **Dedicated Decklist Pages**: Displays the full 100-card list, quantities, grouped card types, card images, and the main commander
- **Arena & Moxfield Export**: Copies a portable Arena line list or Moxfield sectioned list directly to the clipboard
- **Direct Links**: One-click access to full set and card details on Scryfall

## Tech Stack

- **Frontend**: React 19 + Tailwind CSS 4
- **Routing**: Wouter (client-side)
- **UI Components**: shadcn/ui
- **API**: Scryfall REST API
- **Build**: Vite
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/krisaguero/mtg-sets-tracker.git
cd mtg-sets-tracker

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The site will be available at `http://localhost:3000`

### Build for Production

```bash
pnpm build
pnpm preview
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import the GitHub repository
4. Vercel will automatically detect the configuration and deploy

```bash
# Or deploy via CLI
npm i -g vercel
vercel
```

### Manual Deployment

The project builds to `dist/public` for static hosting. Deploy the contents of this directory to any static host (Netlify, GitHub Pages, AWS S3, etc.).

## Project Structure

```
client/
  src/
    pages/          # Page components, including /deck/:setCode/:deckSlug
    components/     # Reusable UI components
    data/           # Compact Commander precon decklist index
    hooks/          # Custom React hooks (Scryfall integration and decklists)
    lib/            # Utility functions
    contexts/       # React contexts
    index.css       # Global styles & design tokens
    App.tsx         # Main app component
server/
  index.ts          # Express server (for production)
```

## Design Philosophy

This project follows a **Minimalist Card Collector Interface** aesthetic:

- **Hard Edges**: All UI elements use square corners (no border-radius)
- **Typography-Driven**: Bold, confident type hierarchy
- **Card-Centric**: Magic cards and set symbols are the visual focus
- **Deep Indigo Accents**: Color palette inspired by Magic's blue mana
- **Chronological Narrative**: Timeline layout tells the story of recent Magic

## API Integration

The app fetches data from the [Scryfall API](https://scryfall.com/docs/api):

- **Sets Endpoint**: `/sets` - Retrieves all Magic sets
- **Cards Search**: `/cards/search` - Resolves set cards, Commander product cards, and paginated card galleries
- **Card Images**: Scryfall `image_uris` are used for commander and decklist imagery
- **Decklist Index**: `client/src/data/commanderDecklists.ts` is a compact build-time index generated from the machine-readable [`decks_v2.json`](https://github.com/taw/magic-preconstructed-decks-data/blob/master/decks_v2.json) dataset. Scryfall resolves the live card metadata and images at runtime.
- **Decklist Route**: `/deck/:setCode/:deckSlug` displays a supported precon’s complete 100-card contents; products without an indexed list link directly to their Scryfall product page.
- **Export Formats**: Arena exports use one `quantity card name` per line. Moxfield exports use explicit `Commander` and `Deck` sections.

No API key is required for public data.

## Features

### Current

- ✅ Display recent Magic sets (last 20)
- ✅ Show set symbols, release dates, and card counts
- ✅ Display individual Commander precons associated with each set
- ✅ Dedicated 100-card decklist pages with main commander identification
- ✅ Arena and Moxfield clipboard exports with visible copy confirmation
- ✅ Grouped decklist sections with quantities and Scryfall card thumbnails
- ✅ Color identity indicators for precons
- ✅ Fallback links for products without an indexed full decklist
- ✅ Direct links to Scryfall for detailed information
- ✅ Responsive design
- ✅ Hard-edge UI aesthetic

### Potential Enhancements

- Add filtering by set type (expansion, core, masters, etc.)
- Search functionality for specific sets
- Expand decklist coverage as new products are added to the source dataset
- Price tracking integration
- Wishlist/collection tracking
- Dark mode toggle
- Advanced filtering by color, mechanics, or release date range

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Data Attribution

Data provided by [Scryfall](https://scryfall.com). Magic: The Gathering is © Wizards of the Coast.

## Support

For issues or feature requests, please open an issue on GitHub.
