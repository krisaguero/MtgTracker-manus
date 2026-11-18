# Precon Market Research Prompt Revision

## Scope

This revision is based on the tracker’s recurring workflow needs—not on factual claims, card names, prices, rankings, or product details from any pasted report. The goal is to make outside research easier to validate, easier to compare month over month, and easier to turn into collection-aware deck actions.

## What the long-form daily prompt should do better

The existing style of prompt is disciplined about source quality, deck fit, budget, and uncertainty. After repeated report cycles, the main improvement is to make the handoff contract explicit.

### 1. Make every claim addressable

Require a stable `claim_id` for every meaningful observation. A claim should identify the exact card or sealed product, exact printing when available, affected precon, source URL, source date, observation window, confidence, and proposed action. This makes later reviews possible without trying to reconstruct a report from prose.

### 2. Separate four kinds of truth

Do not let a strong deck interaction become a market claim. Store these separately:

- **Observed:** what a source visibly says or what a price snapshot records.
- **Deck fit:** why the card improves a particular deck.
- **Market interpretation:** what the price or supply evidence may mean.
- **User action:** buy, reserve, alert, wait, hold, or skip.

### 3. Require a prior-thesis check

For any card mentioned in an earlier report, state whether the earlier thesis is still useful, strengthened, weakened, invalidated, or unresolved. Include the original observation date, comparable exact printing, current observation date, and a sample-size warning.

### 4. Add a collection handoff

For each actionable card, report required quantity, owned quantity, reserved quantity, free quantity, missing quantity, and estimated gap cost. Do not call a card a buy candidate if the user already has enough free copies for the named deck.

### 5. Add an action queue instead of a long recommendation list

Limit the execution layer to a short queue. Each row should include action, quantity, exact printing, price timestamp, maximum delivered total if known, failure case, and the evidence that would change the decision.

### 6. Add a quiet-day branch

The report should be allowed to say: no material change verified, preserve the watchlist, spend nothing. A shorter maintenance report is preferable to recycled movers or manufactured urgency.

### 7. Use a monthly review, not only a daily cadence

Daily reports discover hypotheses. Monthly reviews score them. Track price-direction accuracy, deck-demand accuracy, invalidations, unresolved calls, repeated false positives, and the most common evidence gaps.

## Perplexity prompt

Copy and adapt the following prompt. Keep the variables at the bottom unchanged so each run can be compared.

```text
Act as a source-audited Magic: The Gathering Commander precon and singles research analyst.

Your job is to produce a compact research input for a collection-aware MTG tracker. Do not write generic market commentary. Do not treat a recommendation, deck inclusion, active listing, social post, or one thin transaction as proof of demand or price movement.

WORKFLOW
1. Establish the UTC and local report date, the new-information window, the historical comparison window, and any inaccessible sources.
2. Research official product, decklist, release, rules, legality, spoiler, and reprint information first.
3. Use deck-building sources for deck-fit evidence and printing-specific marketplaces or completed-sale evidence for price evidence.
4. Resolve every actionable card to an exact printing: set code, collector number when available, treatment, finish, language, and condition context. If this cannot be done, label the row unverified.
5. Compare repeated cards and products with dated prior observations. A first observation is a baseline. Repeated mentions are not repeated wins.
6. Separate raw observation, deck-fit evidence, market interpretation, and user action.
7. Prefer precon-specific utility, portable singles, cross-deck bridges, and practical upgrades over speculative purchases.
8. End with a quiet-day conclusion when no material change is verified.

FOR EACH CLAIM, OUTPUT JSON-LIKE FIELDS
- claim_id
- exact_object
- object_type: card | sealed_product | precon | rule_or_product_event
- exact_printing: set_code, collector_number, treatment, finish, language, condition, or unverified
- affected_precon and commander, if applicable
- deck_slot or functional role
- claim_type: price_move | deck_fit | supply | announcement | reprint | rules | adoption | speculation
- observation: concise fact only
- source_url, source_name, source_type, source_date, access_time
- comparison_window and prior_observation, if any
- deck_fit: documented | mechanically-supported | experimental | not_applicable
- market_confidence: Confirmed | Developing | Speculative | Unverified
- liquidity_or_supply_qualifier
- failure_case
- proposed_action: buy-for-play | bundle | reserve-owned | set-alert | wait | hold | skip
- quantity_logic and maximum delivered budget, if relevant

REQUIRED REPORT SECTIONS
A. Executive verdict: what changed, which precon deserves attention, whether buying is justified, and the largest uncertainty.
B. Precon and product change log with source dates.
C. Historical validation: prior thesis, comparable exact printing, current result, sample-size limitation.
D. Up to four deck clinics. For each: anchor, bridge, upgrade, deck slot, exact stock-list cut if verifiable, functional improvement, tradeoff, and price evidence.
E. Cross-deck bridge list: cards useful in more than one relevant precon, with separate deck-fit notes.
F. Action Queue: no more than eight rows, ranked by practical usefulness rather than percentage change.
G. Research Watch: unresolved hypotheses and the next evidence needed.
H. Returning-card ledger: new, repeated deck-fit signal, strengthened, verified rise, verified decline, reprint exposure, weakened, or removed.
I. Quiet-day decision: spend nothing when no evidence-supported action clears the threshold.

QUALITY RULES
- Cite claims where they appear.
- Do not call a price rising, falling, under a threshold, or on a streak without comparable dated evidence.
- Distinguish asking price, market aggregate, completed sale, and buylist.
- Never infer ownership, reservations, or deck completion.
- Do not invent missing watchlist entries or claim complete coverage when access is partial.
- Include a failure case beside every buy or watch suggestion.
- Keep the narrative compact; put broad coverage in tables.

VARIABLES
Report date: {{today}}
Timezone: {{timezone}}
New-information window: {{previous 24 hours or since last run}}
Historical window: {{21 to 90 days, depending on available data}}
Daily delivered budget: {{user supplied ceiling or 0}}
Preferred printing: {{cheapest practical nonfoil unless specified}}
Relevant owned or reserved decks: {{provided separately by tracker}}
```

## Gemini prompt

Gemini can use the same evidence contract, but ask it to act as a structured reviewer and contradiction finder rather than a prose-first market writer.

```text
You are the verification and contradiction-review layer for a Magic: The Gathering Commander precon research pipeline.

Given current web evidence and the attached prior-report records, produce only claims that can be traced to a source or clearly labeled as a hypothesis. Your priority is not to find the most exciting cards. Your priority is to determine what changed, what did not change, and which prior predictions deserve a score update.

REVIEW ORDER
1. Identify the exact object and exact printing.
2. Check official product, rules, release, spoiler, and reprint facts.
3. Check deck-fit evidence for the exact precon and commander.
4. Check dated price and supply evidence using comparable measures.
5. Compare with the prior thesis and classify the result.
6. Calculate the user-specific action only after ownership and reservations are supplied by the tracker.

RETURN FOUR TABLES
1. CLAIMS: claim_id, object, exact printing, precon, slot, observation, source, source date, confidence, failure case.
2. PRIOR-THESIS REVIEW: claim_id, original thesis, current evidence, status (strengthened | weakened | invalidated | unresolved | baseline-only), reason, next check date.
3. ACTION QUEUE: action, exact object, quantity, owned quantity, reserved quantity, missing quantity, price timestamp, budget status, reason.
4. RESEARCH WATCH: hypothesis, evidence needed, confidence, review month, what would invalidate it.

SCORING
- Price direction: confirmed only when comparable exact-printing observations support it.
- Deck demand: confirmed only when deck-specific adoption or documented upgrade evidence supports it.
- Floor status: still falling, possible floor, rebounding, low-liquidity noise, or unresolved. Do not call a floor from one flat observation.
- Confidence: Confirmed, Developing, Speculative, or Unverified.

EDITORIAL CLOSE
Write a five-sentence decision summary, then state whether the correct action is buy for play, bundle, reserve owned copies, set an alert, wait, hold, or skip. “No purchase” is a successful result.

Do not infer ownership, sealed-product ownership, deck completion, sales volume, or liquidity from the supplied prose. Do not silently replace a failed thesis with a new justification.

Run variables:
- date and timezone: {{values}}
- observation window: {{values}}
- prior records: {{attached tracker exports}}
- user budget: {{value}}
- owned and reserved inventory: {{attached tracker export}}
```

## Recommended cadence

Use external research daily only when there is a meaningful information window. Use a weekly desk to consolidate daily observations. Use a monthly thesis review to score predictions. Keep the action queue and collection basket live in the tracker rather than duplicating them in every article.
