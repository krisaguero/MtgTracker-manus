#import "report-theme.typ": report-accent, report-theme

#show: report-theme.with(
  title: "Star Trek Brawlternative Season Two Proxy Sheets",
  author: "MTG Tracker",
  rhythm: "report",
  running-header: false,
)
#set page(paper: "a4", flipped: true, margin: (x: 8mm, y: 8mm), numbering: none)
#set text(font: "DejaVu Sans", size: 8pt)
#set par(first-line-indent: 0pt, spacing: 0.35em)

#let ink = rgb("172033")
#let blue = rgb("2937a2")
#let red = rgb("a83c2f")
#let pale = rgb("eef0fa")
#let cut = (paint: rgb("8390a8"), thickness: 0.45pt)

#let line-field(label, value) = {
  text(size: 6.5pt, weight: "bold", fill: blue)[#label]
  h(0.25em)
  text(size: 7pt, weight: "bold")[#value]
}

#let proxy-card(display, underlying, identity, note, accent: blue) = block(
  width: 64mm,
  height: 88mm,
  inset: 3.5mm,
  fill: white,
  stroke: (paint: accent, thickness: 1.1pt),
  radius: 0pt,
  breakable: false,
)[
  #align(right)[#text(size: 5.5pt, weight: "bold", fill: accent)[BRAWLTERNATIVE · SEASON TWO]]
  #v(1mm)
  #line(length: 100%, stroke: (paint: accent, thickness: 0.6pt))
  #v(2mm)
  #text(size: 11pt, weight: "bold", fill: ink)[#display]
  #v(0.8mm)
  #text(size: 7.2pt, weight: "bold", fill: blue)[#underlying]
  #v(1.5mm)
  #grid(columns: (1fr, 1fr), gutter: 2mm,
    [#line-field("IDENTITY", identity)],
    [#line-field("STATUS", "UNOFFICIAL FAN PROXY")],
  )
  #v(2mm)
  #box(width: 100%, height: 30mm, fill: pale, stroke: (paint: accent, thickness: 0.5pt), inset: 2mm)[
    #align(center + horizon)[
      #text(size: 8pt, weight: "bold", fill: accent)[ARTWORK PANEL]
      #v(1mm)
      #text(size: 6.5pt, fill: ink)[Custom Star Trek visual skin. Keep the ordinary reference card with the deck.]
    ]
  ]
  #v(2mm)
  #text(size: 6.5pt, weight: "bold", fill: blue)[REFERENCE CARD TEXT]
  #v(0.5mm)
  #text(size: 6pt, fill: ink)[Use the underlying card's printed mana cost, type line, rules text, and power/toughness. The display name does not change the game object.]
  #v(1.5mm)
  #line(length: 100%, stroke: cut)
  #v(1mm)
  #text(size: 5.5pt, weight: "bold", fill: red)[CASUAL PROXY · NOT AN OFFICIAL PRINTING]
  #v(0.8mm)
  #text(size: 5.5pt, fill: ink)[Episode note: #note]
]

#let token-card(name, type, reminder, accent: red) = block(
  width: 64mm,
  height: 88mm,
  inset: 3.5mm,
  fill: white,
  stroke: (paint: accent, thickness: 1.1pt),
  radius: 0pt,
  breakable: false,
)[
  #align(right)[#text(size: 5.5pt, weight: "bold", fill: accent)[TOKEN REFERENCE · CASUAL BOX]]
  #v(1mm)
  #line(length: 100%, stroke: (paint: accent, thickness: 0.6pt))
  #v(2mm)
  #text(size: 16pt, weight: "bold", fill: ink)[#name]
  #v(0.8mm)
  #text(size: 7pt, weight: "bold", fill: blue)[#type]
  #v(2mm)
  #box(width: 100%, height: 38mm, fill: pale, stroke: (paint: accent, thickness: 0.5pt), inset: 2mm)[
    #align(center + horizon)[#text(size: 9pt, weight: "bold", fill: accent)[TOKEN ART PANEL]]
  ]
  #v(2mm)
  #text(size: 6.5pt, weight: "bold", fill: blue)[REMINDER TEXT]
  #v(0.5mm)
  #text(size: 7pt, fill: ink)[#reminder]
  #v(2mm)
  #line(length: 100%, stroke: cut)
  #v(1mm)
  #text(size: 5.5pt, fill: ink)[Use a neutral sleeve or opaque back. These tokens support the Season Two Brawlternative box and are not official token printings.]
]

#align(left)[
  #text(size: 17pt, weight: "bold", fill: blue)[Star Trek Brawlternative]
  #h(0.5em)
  #text(size: 12pt, weight: "bold")[Season Two · Proxy Captain Frames]
  #v(1mm)
  #text(size: 7pt, fill: ink)[Cut on the outer borders. Keep an ordinary reference copy of the underlying commander with each sleeved proxy. These sheets preserve identity; they do not replace rules text.]
]
#v(4mm)
#grid(columns: (1fr, 1fr, 1fr, 1fr), gutter: 4mm,
  proxy-card("THE REPLICATOR, PATTERN CASCADE", "Brudiclad, Telchor Engineer", "Blue / Red", "Make ordinary tokens, then choose the best pattern."),
  proxy-card("TRANSPORTER CHIEF, PATTERN RECONSTRUCTION", "Brenard, Ginger Sculptor", "Green / White / Blue", "Return useful crew as Food Golem replicas.", accent: rgb("327b52")),
  proxy-card("EMERGENCY MEDICAL HOLOGRAM, ENDLESS SHIFT", "Shirei, Shizo's Caretaker", "Black", "Small crew members report for another shift.", accent: rgb("55256f")),
  proxy-card("IMPROVISED POWER SPECIALIST", "Toggo, Goblin Weaponsmith", "Blue / Red · Partner", "Lands create Rock ammunition.", accent: red),
)
#v(4mm)
#text(size: 6.5pt, fill: ink)[Partner companion frame: #strong[CHIEF ENGINEER, EMERGENCY RETROFIT] — Glacian, Powerstone Engineer. Keep both commander names visible and use 58 other cards.]

#pagebreak()
#align(left)[
  #text(size: 17pt, weight: "bold", fill: blue)[Season Two Token Sheet]
  #h(0.5em)
  #text(size: 12pt, weight: "bold")[Replicator · Transporter · Redshirt · Geological Warp Drive]
  #v(1mm)
  #text(size: 7pt, fill: ink)[Print at 100%. These reference tokens are intentionally plain so the card frames remain clearly casual and unofficial.]
]
#v(4mm)
#grid(columns: (1fr, 1fr, 1fr, 1fr), gutter: 4mm,
  token-card("MYR", "Artifact Creature token", "This token is a 1/1 colorless Myr artifact creature."),
  token-card("SERVO", "Artifact Creature token", "This token is a 1/1 colorless Servo artifact creature."),
  token-card("THOPTER", "Artifact Creature token · Flying", "This token is a 1/1 colorless Thopter artifact creature with flying."),
  token-card("FOOD GOLEM", "Artifact Creature token", "This token is a 1/1 Food Golem artifact creature. Brenard's actual rules text governs its creation."),
  token-card("ROCK", "Artifact Equipment token", "Equip 2. Equipped creature has 1: This creature deals 2 damage to any target, then sacrifice this Equipment.", accent: red),
  token-card("TREASURE", "Artifact token", "Tap, sacrifice this artifact: Add one mana of any color."),
  token-card("CLUE", "Artifact token", "2, Tap, sacrifice this artifact: Draw a card."),
  token-card("GOAT", "Creature token", "This token is a 0/1 white Goat creature. Trading Post may create one."),
)
#pagebreak()
#align(left)[
  #text(size: 17pt, weight: "bold", fill: blue)[Season Two Quick Reference]
  #h(0.5em)
  #text(size: 12pt, weight: "bold")[Sideboard tray and budget swap reminders]
]
#v(4mm)
#box(width: 100%, inset: 3mm, fill: pale, stroke: (paint: blue, thickness: 0.6pt))[
  #text(size: 7pt, weight: "bold", fill: blue)[TOKEN SAFETY REMINDERS]
  #v(1mm)
  #text(size: 6.5pt, fill: ink)[Brudiclad changes existing tokens into copies but does not make them enter again. Brenard's trigger requires a nontoken creature. Shirei's return is delayed until the next end step and depends on Shirei remaining on the battlefield. Toggo's Rock requires equip, mana, a tapped equipped creature, and sacrifice; it is not a free Shock.]
]
#v(4mm)
#grid(columns: (1fr, 1fr), gutter: 5mm,
  [
    #text(size: 10pt, weight: "bold", fill: blue)[Replicator Malfunction]
    #v(1mm)
    #text(size: 7pt)[Sideboard: Rite of Replication · Masterful Replication · Academy Manufactor · Junk Winder · Aetherize]
    #v(1mm)
    #text(size: 7pt)[Budget swaps: Rite of Replication → Quasiduplicate; Myr Battlesphere → Myr Sire; Academy Manufactor → Ichor Wellspring.]
    #v(4mm)
    #text(size: 10pt, weight: "bold", fill: blue)[Transporter Accident]
    #v(1mm)
    #text(size: 7pt)[Sideboard: Eerie Interlude · Panharmonicon · Reclamation Sage · Rootborn Defenses]
    #v(1mm)
    #text(size: 7pt)[Budget swaps: Panharmonicon → Wall of Omens; Adrix and Nev → Second Harvest; Mulldrifter → Elvish Visionary.]
  ],
  [
    #text(size: 10pt, weight: "bold", fill: blue)[Redshirt Recovery Program]
    #v(1mm)
    #text(size: 7pt)[Sideboard: Ophiomancer · Doomed Dissenter · Nested Shambler · Pawn of Ulamog · Malakir Rebirth]
    #v(1mm)
    #text(size: 7pt)[Budget swaps: Pitiless Plunderer → Pawn of Ulamog; Bastion of Remembrance → Sling-Gang Lieutenant; Workshop Assistant → Myr Retriever.]
    #v(4mm)
    #text(size: 10pt, weight: "bold", fill: blue)[Geological Warp Drive]
    #v(1mm)
    #text(size: 7pt)[Sideboard: Retrofitter Foundry · Academy Manufactor · Ghost Town · Valakut Exploration · Rise and Shine]
    #v(1mm)
    #text(size: 7pt)[Budget swaps: Shimmer Dragon → Pilgrim's Eye; Academy Manufactor → Trading Post; Rise and Shine → Ghirapur Gearcrafter; Temple of Epiphany → Swiftwater Cliffs.]
  ],
)
#v(6mm)
#box(width: 100%, inset: 4mm, fill: pale, stroke: 0.6pt + red)[
  #text(size: 8pt, weight: "bold", fill: red)[FORMAT CHECK]
  #v(1mm)
  #text(size: 7pt)[60 cards including commander · singleton except basic lands · 25 life · no commander damage · underlying color identity controls deckbuilding · no intentional infinite loops or repeatable resource-denial locks. These fan proxies are for casual play and should remain visibly unofficial.]
]
