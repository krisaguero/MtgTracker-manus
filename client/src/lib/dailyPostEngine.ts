/* Design reminder: hard-edged market publishing engine; generates daily Top 5 mover posts with rigorous movement explanations and weekly prediction performance roundups. */

export interface DailyMoverPostItem {
  rank: number;
  cardName: string;
  setCode: string;
  currentUsd: number;
  percentChange: number;
  driverCategory: string;
  movementThesis: string;
}

export interface DailyMoverPost {
  date: string;
  title: string;
  subtitle: string;
  topMovers: DailyMoverPostItem[];
  marketTakeaway: string;
}

export interface PredictionRoundupItem {
  id: string;
  cardName: string;
  predictedDate: string;
  originalPrediction: string;
  initialPrice: number;
  currentPrice: number;
  status: 'Moved as Predicted' | 'Stalled / Rangebound' | 'Reversed / Corrected';
  outcomeNotes: string;
}

export interface WeeklyRoundup {
  weekLabel: string;
  summary: string;
  accuracyRate: number | null; // null when no audited outcome history exists
  predictions: PredictionRoundupItem[];
}

export function getDailyMoverPost(): DailyMoverPost {
  return {
    date: 'Illustrative sample · not live',
    title: 'Sample Market Brief: Five Illustrative Price-Movement Cases',
    subtitle: 'This page currently uses hard-coded demonstration values. It is not a scan of today’s Scryfall data, vendor inventory, or completed transactions.',
    topMovers: [
      {
        rank: 1,
        cardName: 'Doubling Season',
        setCode: 'rav',
        currentUsd: 48.00,
        percentChange: 42.5,
        driverCategory: 'High Value Spikes',
        movementThesis: 'Hypothetical example only: a token-focused commander could increase demand for this card. No live listing, sales, or inventory evidence is connected to this sample.',
      },
      {
        rank: 2,
        cardName: 'Ashnod\'s Altar',
        setCode: 'atq',
        currentUsd: 4.50,
        percentChange: 88.0,
        driverCategory: 'Penny Risers & Buyout Targets',
        movementThesis: 'Hypothetical example only: a new sacrifice interaction could draw attention. This is not evidence of a coordinated buyout or thin current inventory.',
      },
      {
        rank: 3,
        cardName: 'Fierce Guardianship',
        setCode: 'c20',
        currentUsd: 38.00,
        percentChange: 24.2,
        driverCategory: 'Commander Format Staples',
        movementThesis: 'Hypothetical example only: staple demand and reprint supply can affect prices. This sample does not measure either factor.',
      },
      {
        rank: 4,
        cardName: 'Mystic Remora',
        setCode: 'ice',
        currentUsd: 11.00,
        percentChange: 31.0,
        driverCategory: 'RC Rule-Change Watchers',
        movementThesis: 'Hypothetical example only: format or policy discussion can influence player attention. No current event is asserted by this demonstration.',
      },
      {
        rank: 5,
        cardName: 'Aftermath Analyst',
        setCode: 'eoc',
        currentUsd: 0.85,
        percentChange: 112.5,
        driverCategory: 'Penny Risers & Buyout Targets',
        movementThesis: 'Hypothetical example only: a newly explored synergy can change interest in an inexpensive card. No current format result is being reported here.',
      },
    ],
    marketTakeaway: 'This is an editorial layout sample, not evidence that any card is moving today. Before acting on a market idea, check a dated quote, recent completed sales, listing depth, reprint risk, and the exact printing.',
  };
}

export function getWeeklyPredictionRoundup(): WeeklyRoundup {
  return {
    weekLabel: 'Illustrative fixture · not an audited week',
    summary: 'The predictions and prices below are hard-coded examples; they have not been reconciled against dated market records and do not represent model performance.',
    accuracyRate: null,
    predictions: [
      {
        id: 'pred-1',
        cardName: 'Smothering Tithe',
        predictedDate: 'Aug 11, 2026',
        originalPrediction: 'Predicted +25% breakout due to white mana-ramp demand in casual Commander pods.',
        initialPrice: 19.20,
        currentPrice: 24.00,
        status: 'Moved as Predicted',
        outcomeNotes: 'Successfully hit target (+25%) following heavy weekend tournament adoption and vendor restock delays.',
      },
      {
        id: 'pred-2',
        cardName: 'Ashnod\'s Altar',
        predictedDate: 'Aug 12, 2026',
        originalPrediction: 'Predicted speculative buyout surge past $4.00 on Reddit thread momentum.',
        initialPrice: 2.40,
        currentPrice: 4.50,
        status: 'Moved as Predicted',
        outcomeNotes: 'Exceeded expectations (+87%) as regional retailers cleared out remaining inventory.',
      },
      {
        id: 'pred-3',
        cardName: 'Cyclonic Rift',
        predictedDate: 'Aug 10, 2026',
        originalPrediction: 'Predicted stable sideways consolidation around $32.00.',
        initialPrice: 32.00,
        currentPrice: 32.00,
        status: 'Stalled / Rangebound',
        outcomeNotes: 'Held flat as expected; heavy reprint saturation countered casual format absorption.',
      },
      {
        id: 'pred-4',
        cardName: 'Mental Misstep',
        predictedDate: 'Aug 11, 2026',
        originalPrediction: 'Predicted spike to $4.50 on Legacy meta shifts.',
        initialPrice: 3.10,
        currentPrice: 3.20,
        status: 'Stalled / Rangebound',
        outcomeNotes: 'Movement stalled below resistance as tournament meta favored alternate removal suites.',
      },
      {
        id: 'pred-5',
        cardName: 'Dockside Extortionist (Precon Foil)',
        predictedDate: 'Aug 10, 2026',
        originalPrediction: 'Predicted continued correction toward $45.00 following announcement.',
        initialPrice: 62.00,
        currentPrice: 55.00,
        status: 'Reversed / Corrected',
        outcomeNotes: 'Correction was sharper than anticipated due to panic selling by speculative holders.',
      },
    ],
  };
}
