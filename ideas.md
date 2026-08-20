# MTG Sets Tracker - Design Philosophy

## Design Approach: Modern Trading Card Catalog

### Design Movement
**Minimalist Card Collector Interface** — inspired by high-end trading card marketplaces and modern museum exhibition catalogs. Clean typography, hard edges, and strategic use of card imagery create a premium, professional aesthetic that respects both the cards and the collector's intelligence.

### Core Principles
1. **Hard Edges, Clean Geometry** — All UI elements use square corners and sharp lines. No rounded borders. This creates a technical, precise feel that mirrors the structured nature of card collecting.
2. **Typography-Driven Hierarchy** — Bold, confident type treatment with clear distinction between display, heading, and body text. Emphasis on readability and information density.
3. **Card-Centric Layout** — The actual Magic cards are the stars. UI elements frame and contextualize them without competing for attention.
4. **Chronological Narrative** — Sets displayed in reverse chronological order (newest first) with clear temporal markers, creating a visual timeline of Magic's recent history.

### Color Philosophy
- **Primary Background**: Off-white (`oklch(0.98 0 0)`) — neutral, professional, allows card images to pop
- **Accent Color**: Deep indigo (`oklch(0.4 0.15 280)`) — evokes the mystique of Magic's blue mana, used for highlights and interactive elements
- **Text**: Charcoal (`oklch(0.2 0.01 280)`) — high contrast, easy reading
- **Borders**: Subtle gray (`oklch(0.9 0.01 280)`) — defines structure without visual noise
- **Set Dividers**: Soft gradient from indigo to transparent — creates visual separation and temporal flow

### Layout Paradigm
**Asymmetric Timeline Grid** — Sets are displayed in a left-aligned vertical timeline with alternating card preview positions (left/right). This creates visual rhythm while maintaining chronological clarity. No centered layouts; information flows naturally down the page.

### Signature Elements
1. **Set Header Cards** — Large, high-contrast set symbol and release date as a visual anchor
2. **Precon Grid** — Commander precons displayed as a clean grid below each set, showing card art, name, and color identity
3. **Timeline Marker** — Subtle vertical line connecting sets, with date badges at intervals

### Interaction Philosophy
- **Hover States**: Cards subtly lift with shadow increase; precons show additional details (price, card count)
- **Click Behavior**: Links to Scryfall for deeper exploration (no modal dialogs)
- **Loading States**: Skeleton screens that mirror card dimensions for smooth perception

### Animation
- **Entrance**: Cards fade in and slide up slightly (100ms, ease-out) as the page loads, staggered by 30ms per item
- **Hover**: Card lift with shadow transition (150ms, ease-out)
- **Interactions**: All transitions under 200ms; no distracting motion, only purposeful feedback

### Typography System
- **Display Font**: System stack (Segoe UI, Roboto) at 2.5rem, weight 700 — for set names
- **Heading Font**: System stack at 1.25rem, weight 600 — for precon names
- **Body Font**: System stack at 1rem, weight 400 — for descriptions and metadata
- **Monospace**: For set codes and technical details (if needed)

### Brand Essence
**"The collector's companion for Magic's newest sets"** — For players and collectors who want a curated, beautiful view of recent Magic releases with instant access to Commander precons. Sophisticated, informative, and respectfully designed.

**Personality**: Professional, Authoritative, Elegant

### Brand Voice
Headlines and CTAs sound knowledgeable and direct:
- "Recent Magic Sets & Commander Precons" (not "Welcome to our website")
- "Explore on Scryfall" (not "Click here for more")

### Signature Brand Color
**Deep Indigo** (`oklch(0.4 0.15 280)`) — unmistakably Magic, evokes blue mana and premium card collecting

### Wordmark & Logo
A bold, geometric symbol: a stylized card corner (sharp 90-degree angle) in deep indigo, no text. Used in header and as favicon.

---

## Implementation Notes
- **Hard Edges**: All `border-radius` set to `0` or removed entirely
- **Spacing**: Use 16px increments (4, 8, 12, 16, 24, 32, 48px) for consistent rhythm
- **Shadows**: Minimal, only on hover or elevation states
- **Images**: Set symbols and card art are the primary visual content; UI is secondary

## Style Decisions

The Commander archive must visibly use an asymmetric chronological timeline rather than a plain multi-column release grid. Set and precon detail pages begin with a premium set-header treatment containing the set name, code/date, collection status, and a sharp indigo symbol moment before catalog controls. Deep indigo is reserved for global brand/navigation, primary actions, active filters, and timeline markers; rarity and Magic-color accents remain secondary card-level metadata.

## Mobile Review Findings

The mobile audit shows that the 70vh logo-only hero is visually calm but creates too much empty space before the collection hub, while the home timeline and Commander archive rely too heavily on centered loading states. The next pass must preserve the logo-only requirement but make loading states card-shaped and branded, keep the collection hub and discovery chronology visually connected, and ensure archive/detail routes expose a strong timeline or set identity before utility controls. The sharp geometric mark remains the recurring indigo motif.

### Post-refinement mobile verification

The branded skeletons now preserve the intended chronology and card-grid silhouette on `/commander`, `/eoe`, and `/precon/eoc/catalog`; the home collection hub is tighter beneath the logo-only hero. The 70vh hero remains intentionally sparse by the logo-only requirement, while the next content block now starts with a more compact ManaBox header and import action. Further changes should prioritize loaded-state testing when Scryfall data is available, without reintroducing generic centered spinners.
