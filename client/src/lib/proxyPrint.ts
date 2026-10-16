import type { BattleBoxPullItem } from '@/lib/retroBattleBox';

export const PROXY_PRINT_SUPPORT_STORAGE_KEY = 'mtg_tracker_battle_box_proxy_print_support_v1';

/** Proxy-print support is opt-in and disabled unless the browser setting explicitly says enabled. */
export function loadProxyPrintSupportEnabled(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(PROXY_PRINT_SUPPORT_STORAGE_KEY) === 'enabled';
  } catch {
    return false;
  }
}

export function saveProxyPrintSupportEnabled(enabled: boolean): boolean {
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.setItem(PROXY_PRINT_SUPPORT_STORAGE_KEY, enabled ? 'enabled' : 'disabled');
    return true;
  } catch {
    return false;
  }
}

/** With inventory, use the remaining gap after real and held proxy copies; otherwise use source proxy annotations only. */
export function proxyPrintQuantity(item: BattleBoxPullItem, inventoryLoaded: boolean): number {
  return inventoryLoaded ? item.proxyPrintGap : item.proxyMarked;
}

/** Formats only explicitly selected candidate card names and quantities; no inventory or deck metadata is included. */
export function formatSelectedProxyPrintList(
  items: BattleBoxPullItem[],
  selectedNames: ReadonlySet<string>,
  inventoryLoaded: boolean,
): string {
  return items
    .filter((item) => selectedNames.has(item.name) && proxyPrintQuantity(item, inventoryLoaded) > 0)
    .map((item) => `${proxyPrintQuantity(item, inventoryLoaded)} ${item.name}`)
    .join('\n');
}
