# Scryfall decklist implementation notes

Scryfall's official documentation confirms that Set objects expose `code`, `set_type`, `parent_set_code`, `card_count`, and `search_uri`. Commander preconstructed decks are categorized with `set_type: commander`. The card search endpoint returns up to 175 cards per page and supports pagination through `has_more` and `next_page`. A set search such as `e:trc` returns the cards assigned to the Commander product set, including its new cards, but a full 100-card decklist may require querying the related product group with `g:` so sibling and child sets are included.

Scryfall Card objects expose `name`, `type_line`, `oracle_text`, `mana_cost`, `color_identity`, `image_uris`, `card_faces`, `collector_number`, `rarity`, `set`, `set_name`, `set_type`, `reprint`, and `released_at`. Commander identification can therefore use `type_line` containing Legendary Creature or the card's commander legality plus legendary type; the UI should surface a primary commander separately while retaining any secondary legendary creature candidates.

Sources: https://scryfall.com/docs/api/sets, https://scryfall.com/docs/api/cards/search, https://scryfall.com/docs/api/cards, https://scryfall.com/docs/syntax
