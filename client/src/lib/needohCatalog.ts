export type NeeDohCategory = 'Doughy' | 'Maltose / smooth' | 'Watery / jelly' | 'Crunchy' | 'Fuzzy / teenie' | 'Seasonal' | 'Multipack' | 'Food & novelty';

export interface NeeDohStyle {
  id: string;
  name: string;
  category: NeeDohCategory;
  texture: string;
  variants: string[];
  note?: string;
}

export interface ProductChecklistItem {
  id: string;
  name: string;
  family: string;
  category: string;
  texture: string;
  note?: string;
  source: 'NeeDoh' | 'Speks alternative';
}

const style = (name: string, category: NeeDohCategory, texture: string, variants: string[] = [], note?: string): NeeDohStyle => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), name, category, texture, variants, note,
});

/** Collector-facing index assembled from Schylling's product family plus the current field guide. */
export const needohStyles: NeeDohStyle[] = [
  style('Groovy Glob', 'Doughy', 'Classic PVA dough', ['Blue', 'Green', 'Orange', 'Pink', 'Purple']),
  style('Super NeeDoh', 'Doughy', 'Classic PVA dough', ['Pink', 'Orange', 'Green']),
  style('Super Ripples', 'Doughy', 'Classic dough with tactile ripples', ['Wavey Pink', 'Wavey Orange', 'Wavey Purple', 'Wavey Green', 'Circle Pink', 'Circle Orange', 'Circle Purple', 'Circle Green']),
  style('Glow in the Dark', 'Doughy', 'Classic PVA dough with glow shell'),
  style('Atomic', 'Doughy', 'Net-wrapped extrusion', ['Blue/Yellow', 'Yellow/Pink', 'Pink/Blue']),
  style('Press-Doh', 'Doughy', 'Color-reveal dough', ['Night Sky', 'Smiley Faces', 'Mushrooms', 'Hearts and Flowers']),
  style('Color Change', 'Doughy', 'Color-reveal dough', ['Blue/Pink', 'Pink/Purple', 'Yellow/Orange']),
  style('Cool Cats', 'Doughy', 'Cat-shaped dough', ['Pink', 'Orange', 'Purple', 'Green']),
  style('Super Cool Cats', 'Doughy', 'Large cat-shaped dough', ['Blue', 'Purple', 'Pink', 'Orange']),
  style('Funky Pups', 'Doughy', 'Dog-shaped dough', ['Pink', 'Orange', 'Purple', 'Blue']),
  style("Dig' It Pig", 'Doughy', 'Pig-shaped dough', ['Pink', 'Orange', 'Purple', 'Blue']),
  style('Mellow Mallow', 'Doughy', 'UV-reactive marshmallow dough', ['Pink/Red', 'Yellow/Orange', 'Blue/Purple']),
  style('Groovy Shroom', 'Doughy', 'Interchangeable-cap mushroom', ['Orange/Purple', 'Pink/Orange', 'Blue/Pink']),
  style('Fuzz Ball Flower Power', 'Fuzzy / teenie', 'Fuzzy groovy glob', ['Pink', 'Orange', 'Purple', 'Blue', 'Green']),
  style('Fuzz Ball Wonder Waves', 'Fuzzy / teenie', 'Fuzzy groovy glob with waves', ['Pink', 'Orange', 'Purple', 'Blue', 'Green']),
  style('Fuzz Ball Wild Cats', 'Fuzzy / teenie', 'Fuzzy cat with expressions', ['Pink', 'Yellow', 'Purple', 'Blue', 'Green', '6 expressions']),
  style('Shaggy', 'Fuzzy / teenie', 'Textured fuzzy glob', ['Green', 'Pink', 'Purple', 'Blue']),
  style('Squeezza', 'Food & novelty', 'Pizza-shaped dough', ['Pink Crust', 'Yellow Crust', 'Orange Crust']),
  style("Peace O' Cake", 'Food & novelty', 'Cake-shaped dough'),
  style('Dohnuts', 'Food & novelty', 'Donut-shaped dough', ['Sprinkle Blue/Pink', 'Sprinkle Purple/Yellow', 'Sprinkle Pink/Orange', 'Drizzle Blue/Pink', 'Drizzle Purple/Yellow', 'Drizzle Pink/Orange', 'Powder Blue/Pink', 'Powder Purple/Yellow', 'Powder Pink/Orange']),
  style('Jelly Dohnut', 'Maltose / smooth', 'Jelly-filled donut', ['Sprinkle Blue', 'Sprinkle Pink', 'Sprinkle Purple', 'Drizzle Blue', 'Drizzle Pink', 'Drizzle Purple']),
  style('Groovy Fruits', 'Food & novelty', 'Fruit-themed dough trio', ['Boss Banana', 'Outta Sight Strawberry', 'Far Out Orange']),
  style('Swirlie Egg', 'Food & novelty', 'Egg-shaped dough', ['Pink', 'Orange', 'Purple']),
  style('Dohjees Series 1', 'Fuzzy / teenie', 'Costumed blind-box teenie', Array.from({ length: 24 }, (_, i) => `Style ${i + 1}`)),
  style('Dohjees Series 2', 'Fuzzy / teenie', 'Costumed blind-box teenie', ['Boomz', 'Zenon', 'Zoidz', 'Norm', 'Woofy', 'Finn', 'Dadoh', 'Zoomz', 'Frank', 'Zongo', 'Stan', 'Sirgeo', 'Gluppy', 'Pippo', 'Yo-Ho', 'Kaji', 'Clops', 'Ringo', 'Yawnz', 'Radoh', 'Cadoh', 'Astro', 'Vando', 'Blobr', 'Secret 1', 'Secret 2', 'Secret 3', 'Secret 4']),
  style('Nice Cube', 'Maltose / smooth', 'Translucent maltose ice cube', ['Pink', 'Purple', 'Blue']),
  style('Nice Cube Swirl', 'Maltose / smooth', 'Clear maltose cube with color swirls', ['Orange', 'Purple', 'Blue', 'Green']),
  style('Nice Cube Glow', 'Maltose / smooth', 'Glow maltose cube', ['Pink', 'Orange', 'Purple', 'Blue', 'Green']),
  style('Nice Cube Glowfalke', 'Maltose / smooth', 'Special glow cube'),
  style('Nice Cube Glitter & Glow', 'Maltose / smooth', 'Glitter and glow cube', ['Pink', 'Purple', 'Blue']),
  style('Nice Berg', 'Maltose / smooth', 'Oversized 3.25-inch maltose cube', [], 'Often misremembered as “Iceberg”; the official product name is Nice Berg.'),
  style('Nice Berg Swirl', 'Maltose / smooth', 'Oversized clear swirl cube', ['Orange', 'Purple', 'Blue']),
  style('Nice Berg Glitter & Glow', 'Maltose / smooth', 'Oversized glitter and glow cube'),
  style('Nice Ice Baby', 'Maltose / smooth', 'Pocket-size maltose cube', ['Blue', 'Pink', 'Purple']),
  style('Gumdrop', 'Maltose / smooth', 'Sugary maltose squeeze', ['Pink', 'Orange', 'Purple', 'Blue']),
  style('Dream Drop', 'Maltose / smooth', 'Sparkly maltose teardrop', ['Pink', 'Purple', 'Blue']),
  style('Galactic Glow Dream Drop', 'Maltose / smooth', 'Glow-in-the-dark maltose teardrop', ['Purple', 'Blue', 'Green']),
  style('Good Vibes Only', 'Maltose / smooth', 'Message-shaped maltose squish', ['Purple', 'Orange', 'Green']),
  style('Splootsplat', 'Maltose / smooth', 'Maltose novelty shape', ['Purple', 'Blue', 'Green']),
  style('Jelly Squish', 'Maltose / smooth', 'Jellyfish-shaped maltose squish', ['Pink', 'Purple', 'Blue']),
  style('Nice-Sicle', 'Maltose / smooth', 'Popsicle-shaped maltose squish', ['Orange', 'Pink', 'Purple']),
  style('Nice Cream Cone', 'Maltose / smooth', 'Opaque ice-cream-cone maltose', ['Pink', 'Orange', 'Blue']),
  style('Smushroom', 'Maltose / smooth', 'Maltose mushroom', ['Pink', 'Orange', 'Blue', 'Green']),
  style('Tuff Nugget', 'Maltose / smooth', 'Chunky maltose nugget', ['Pink', 'Orange', 'Purple', 'Black', 'Grey', 'Gold']),
  style('Snow Ball Crunch', 'Crunchy', 'Starch and glitter crunch'),
  style('Happy Snappy', 'Food & novelty', 'Novelty snap squish', ['Pink', 'Purple', 'Blue', 'Green']),
  style('Panic Pete', 'Food & novelty', 'Classic pop-out-face novelty', ['Pink', 'Orange', 'Purple', 'Green', 'Tan']),
  style('Noodlies', 'Food & novelty', 'Stretchable TPR noodles', ['Pink', 'Orange', 'Yellow', 'Blue', 'Green']),
  style('Ramen Noodlies', 'Food & novelty', 'Ramen-packaged stretch noodles', ['Pink', 'Orange', 'Yellow', 'Blue', 'Green']),
  style("Mac N' Squeeze", 'Food & novelty', 'Finger-sized pasta tubes', ['Pink', 'Yellow', 'Blue', 'Green']),
  style('Groovy Jewel', 'Watery / jelly', 'Water and glitter diamond', ['Pink', 'Purple', 'Blue']),
  style('Marbleez', 'Watery / jelly', 'Water-bead squish'),
  style('Crystal Squeeze', 'Watery / jelly', 'Water with crystalline strips', ['Pink', 'Purple', 'Blue']),
  style('Stardust Shimmer', 'Watery / jelly', 'Water and glitter glob', ['Red', 'Purple', 'Blue']),
  style('Gummy Bear', 'Watery / jelly', 'Jelly-filled bear', ['Pink', 'Orange', 'Purple', 'Blue']),
  style("World's Smallest NeeDoh", 'Fuzzy / teenie', 'Mini classic glob', ['Pink', 'Orange', 'Purple', 'Blue', 'Green']),
  style('Bubble Glob', 'Watery / jelly', 'Bubble-textured water glob', ['Pink', 'Purple', 'Blue']),
  style('Magma', 'Watery / jelly', 'Flowing water novelty', ['Blue', 'Orange', 'Grey']),
  style('Booper', 'Watery / jelly', 'Water-filled novelty', ['Pink', 'Purple', 'Blue', 'Red']),
  style('Krystal Kitty', 'Watery / jelly', 'Crystal water cat', ['Pink', 'Purple']),
  style('Squeezy Peezy', 'Watery / jelly', 'Water-filled novelty'),
  style('Lava Lamp', 'Watery / jelly', 'Flowing water novelty', ['Pink', 'Orange', 'Green']),
  style('Dohzee', 'Fuzzy / teenie', 'Mini themed glob', ['Classic Pink', 'Classic Purple', 'Classic Blue', 'Print Galaxy', 'Print Tie-Dye', 'Furry', 'Mermaid', 'Ramen', 'Cool Cat Pink', 'Cool Cat Purple', 'Cool Cat Blue']),
  style('Cool Kittens', 'Multipack', 'Four-cat multipack', ['Cuddles', 'Jinxy', 'Whiskers', 'Frisky']),
  style('Donut Holes 4pc', 'Multipack', 'Four-piece donut multipack', ['Powder Pink', 'Powder Orange', 'Sprinkle Pink', 'Sprinkle Purple']),
  style('Donut Holes 6pc', 'Multipack', 'Six-piece donut multipack'),
  style('Teenie NeeDoh Fab Four', 'Multipack', 'Four-style teenie multipack', ['Color Change', 'Ripples', 'Glow', 'Swirl']),
  style('Teenie NeeDoh Quad Squad', 'Multipack', 'Four-style teenie multipack', ['Original', 'Crunch', 'Sparkle', 'Rainbow']),
  style('Teenie NeeDoh 3pc', 'Multipack', 'Three-piece teenie multipack'),
  style('Teenie Cool Cats', 'Multipack', 'Eight-expression cat multipack', ['Pink', 'Orange', 'Purple', 'Blue']),
  style('Teenie Funky Pup', 'Multipack', 'Eight-expression dog multipack', ['Pink', 'Orange', 'Purple', 'Blue']),
  style('Teenie Fuzz Ball', 'Multipack', 'Fuzzy teenie multipack', ['3pc', '4pc']),
  style('NeeDoh Rainboh', 'Multipack', 'Rainbow multipack'),
  style('Teenie Hot Shots', 'Multipack', 'Sports-ball teenie multipack', ['Baseball', 'Basketball', 'Soccerball', 'Football']),
  style('Teenie Swirl', 'Multipack', 'Swirl teenie multipack'),
  style('Gobs of Globs', 'Multipack', 'Classic glob multipack'),
  style('Dohjees 3 Pack', 'Multipack', 'Dohjees multipack'),
  style('Stickums', 'Multipack', 'Adhesive novelty multipack', ['Pink', 'Orange', 'Purple', 'Blue', 'Green']),
  style('Farmyard Squishkins', 'Multipack', 'Farm-animal multipack', ['Bacon Bit', 'Huggy Nugget', 'Mootilda', 'Mane Squeeze']),
  style('Polar Glow Penguin', 'Seasonal', 'Holiday glow penguin'),
  style('Cool Cane', 'Seasonal', 'Five-glob holiday cane'),
  style('Squishmas Squishkins', 'Seasonal', 'Holiday character multipack', ['Santa', 'Rudy the Reindoh', 'The Ginger-Doh-Man', 'Groovy the Doh-Man', 'Penny Penguin']),
  style('Knittens', 'Seasonal', 'Holiday kitten squish', ['Green', 'Pink']),
  style('Teenie Tree', 'Seasonal', 'Holiday teenie tree'),
  style('Squishmas Advent Calendar', 'Seasonal', '24-day seasonal assortment'),
  style('Squisher the Reindoh', 'Seasonal', 'Crunchy holiday reindeer', ['Orange', 'Purple', 'Blue']),
  style('Groovy the Glowman', 'Seasonal', 'Crunchy or gelly holiday snowman', ['Crunchy Pink', 'Crunchy Purple', 'Crunchy Blue', 'Gelly Pink', 'Gelly Purple', 'Gelly Blue']),
  style('Ginger Glowman', 'Seasonal', 'Holiday glow character', ['Pink', 'Purple', 'Green']),
  style('Squish N Flow Snow Globe', 'Seasonal', 'Snow-globe novelty', ['Penguin', 'Snowman', 'Reindeer', 'Santa']),
  style('Heart Strings', 'Seasonal', 'Heart-forming stretch noodles'),
  style('Honey Hugs Bear', 'Seasonal', 'Message-bearing dough bear', ['Pink LOML', 'Pink Cutie', 'Purple ILYSM', 'Purple XOXO', 'Blue Bruh', 'Blue Ur My Fav']),
  style('Squeeze Hearts', 'Seasonal', 'Message heart dough', ['Pink', 'Orange', 'Purple', 'Blue']),
  style('Color Change Squeeze Hearts', 'Seasonal', 'Color-reveal message hearts', ['Blue/Green', 'Purple/Orange', 'Pink/Purple']),
  style('Teenie Squeeze Hearts', 'Seasonal', 'Three-piece heart teenies', ['Pink', 'Yellow', 'Purple']),
  style('Teenie Sparkle Squeeze Hearts', 'Seasonal', 'Sparkle heart teenies', ['Pink', 'Purple', 'Blue']),
  style('Chicka Deedoos', 'Seasonal', 'Interchangeable-shell chicks', ['Pink', 'Yellow', 'Blue']),
  style('Squeezter Eggs', 'Seasonal', 'Water-filled Easter eggs', ['Bunny Pink', 'Bunny Orange', 'Bunny Blue', 'Bunny Green', 'Chick Pink', 'Chick Orange', 'Chick Blue', 'Chick Green']),
  style("Dippin' Dazzler Eggs", 'Seasonal', 'Color-changing water-dip eggs', ['Smooth Sunrise', 'Groovy Haze', 'Nosey Posey Pink']),
  style('Jelly Hops', 'Seasonal', 'Maltose bunny', ['Pink', 'Yellow', 'Blue']),
  style('Spooky Squishkins', 'Seasonal', 'Halloween character multipack', ['Monster Mush', 'Gooey Ghost', 'Count Dohcula', 'Frankensquish']),
  style('Costumed Glowy Ghost', 'Seasonal', 'Costumed glow ghost', ['Pirate', 'Girl', 'Monster', 'Vampire']),
  style('Glowy Ghost', 'Seasonal', 'Expression glow ghost', ['Pink', 'Orange', 'Purple', 'Green', '6 expressions']),
  style('Baby Boos', 'Seasonal', 'Mini Halloween ghosts', ['Orange', 'Purple', 'Green']),
  style('Jack-Glow-Lantern', 'Seasonal', 'Glowing pumpkin', ['US Smiley', 'US Silly', 'US Scary', 'UK Pink', 'UK Orange', 'UK Purple', 'UK Green']),
  style('Teenie Jack-Glow-Lanterns', 'Seasonal', 'Three-piece pumpkin multipack'),
  style('Sugar Skull Cats', 'Seasonal', 'Halloween cat squish', ['Pink', 'Purple', 'Blue']),
  style('Nice Cube Candy Swirl', 'Seasonal', 'Candy-colored Nice Cube'),
  style('Sparkle Squish Heart', 'Seasonal', 'Heart release noted for 2027', ['Pink', 'Purple', 'Gold', 'Red']),
  style('Fuzzy Hugs Bear', 'Seasonal', 'Fuzzy bear release noted for 2027', ['Pink', 'Orange', 'Blue']),
  style('Melt My Heart', 'Seasonal', 'Heart release noted for 2027', ['Pink', 'Purple', 'Red']),
  style('Wonder Eggs', 'Seasonal', 'Egg release noted for 2027', ['Waves', 'Flowers', 'Dots']),
  style('Teenie Spring Sparkle', 'Seasonal', 'Spring multipack noted for 2027'),
  style('Squeezter Basket', 'Seasonal', 'Spring basket noted for 2027', ['Bunny', 'Duck', 'Lamb']),
  style('Golden Egg Hunt', 'Seasonal', 'Easter multipack noted for 2027'),
];

export const needohCategories = ['All', ...Array.from(new Set(needohStyles.map((item) => item.category)))];
export const needohTextures = ['All', ...Array.from(new Set(needohStyles.map((item) => item.texture)))];

/**
 * Flatten family records into practical checklist rows. A family with named
 * variants becomes one row per variant; a family without variants remains one
 * row. This preserves the original catalog while allowing collectors to mark
 * individual colors, expressions, and characters.
 */
export const needohChecklistItems: ProductChecklistItem[] = needohStyles.flatMap((item) => {
  const variants = item.variants.length ? item.variants : ['Core style'];
  return variants.map((variant) => ({
    id: `${item.id}--${variant.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
    name: item.variants.length ? `${item.name} — ${variant}` : item.name,
    family: item.name,
    category: item.category,
    texture: item.texture,
    note: item.note,
    source: 'NeeDoh' as const,
  }));
});

const alternative = (family: string, name: string, category: string, texture: string, note?: string): ProductChecklistItem => ({
  id: `speks--${family}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  name,
  family,
  category,
  texture,
  note,
  source: 'Speks alternative',
});

/** Attached Speks collector guide, kept separate from the official NeeDoh ledger. */
export const needohAlternatives: ProductChecklistItem[] = [
  ...['Mini', 'Original', 'Jumbo'].flatMap((size) => ['Dew', 'Sea Glass', 'Moon Jelly', 'Mist', 'Dusk', 'Coral'].map((color) => alternative('Gump Ball', `${size} Gump Ball — ${color}`, 'Memory gel', 'Velvety silicone shell with slow-rebound memory gel core'))),
  ...['Mini', 'Standard', 'Jumbo'].flatMap((size) => ['Dew', 'Sea Glass', 'Moon Jelly', 'Mist'].map((color) => alternative('Gump Loop', `${size} Gump Loop — ${color}`, 'Memory gel', 'Velvety loop-shaped memory gel', 'Torus form with center opening for looping and stretching.'))),
  ...['Quilt', 'Scale', 'Burst', 'Edge'].flatMap((texture) => {
    const color = ({ Quilt: 'Moon Jelly', Scale: 'Mist', Burst: 'Dew', Edge: 'Sea Glass' } as Record<string, string>)[texture];
    return [alternative('Gump Surface', `Gump Surface — ${texture} / ${color}`, 'Textured memory gel', 'Raised tactile geometric or organic surface')];
  }),
  alternative('Gump Novelty Shapes', 'Gump Heart', 'Memory gel', 'Heart-shaped memory gel squeezable'),
  ...['Lime', 'Green', 'Blue', 'Purple', 'Pink', 'Orange'].map((color) => alternative('Blur Focus Putty', `Blur Focus Putty — ${color}`, 'Putty', 'Non-drying velvety silicone-foam putty', '40g twist-top travel container; matte, buttery, soft-stretch resistance.')),
  ...['Blue', 'Evergreen', 'Mulberry'].map((color) => alternative('Fleks Magnetic Silicone', `Fleks — ${color}`, 'Magnetic silicone', 'Smooth matte rubber with magnetic structural resistance', 'Set of six soft-touch silicone magnetic pieces with steel building base.')),
];

export const alternativeCategories = ['All', ...Array.from(new Set(needohAlternatives.map((item) => item.category)))];
