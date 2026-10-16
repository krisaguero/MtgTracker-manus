import { commanderDecklistsData } from './commanderDecklistsData';
import type { RawCommanderDeck, RawDeckCard } from './commanderDecklistsData';
import { mergeMtgjsonCommanderDecks } from './mtgjsonPreconDecks';

export type { RawCommanderDeck, RawDeckCard };
export const commanderDecklists: RawCommanderDeck[] = mergeMtgjsonCommanderDecks(commanderDecklistsData);
