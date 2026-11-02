export type Locale = 'en' | 'es';

export function getLocale(search = typeof window !== 'undefined' ? window.location.search : ''): Locale {
  return new URLSearchParams(search).get('locale') === 'es' ? 'es' : 'en';
}

export function setLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  document.documentElement.lang = locale;
  const url = new URL(window.location.href);
  url.searchParams.set('locale', locale);
  window.history.replaceState({}, '', url);
}

export const portfolioMessages = {
  en: {
    mission: 'Active mission', import: 'Import preview & reconciliation', basket: 'Purchase basket', reserve: 'Deck reservations', budget: 'Portfolio budget planner', history: 'Acquisition performance', builds: 'Saved alternate builds', language: 'Language',
    missionProgress: 'Event-derived local progress', complete: 'complete', waiting: 'waiting for event', approveTransfer: 'Approve surplus transfer event',
    importHelp: 'Every row must be reviewed before it changes the inventory. Exact printings can be approved or rejected; missing set or collector data remains blocked until resolved.', selectFile: 'Select ManaBox file', added: 'added', merged: 'merged', flagged: 'flagged', rejected: 'rejected', approve: 'Approve', reject: 'Reject', applyRows: 'Apply approved rows only',
    basketHelp: 'Missing cards from the current upgrade lane, grouped by priority and priced from the planning snapshot.', core: 'Core shell', wall: 'Wall conversion', high: 'High power', basketTotal: 'Estimated basket total',
    reservationHelp: 'Reservations are quantity-aware. The dashboard shows scanned copies, allocated copies, and what remains available for another deck.', reserveCopy: 'Reserve one available copy for Abzan Armor', releaseOne: 'Release one', noReservations: 'No physical copies reserved yet.', scanned: 'Scanned', allocated: 'Allocated', available: 'Available', noCopies: 'No unreserved scanned copies are available.',
    budgetHelp: 'Compare three ways to reach the current build target. Transfer value is the planning value of cards already reserved from another deck, not new cash spend.', buyPrecon: 'Buy this precon', buySingles: 'Buy singles', transferSingles: 'Transfer + singles', notRecorded: 'Not recorded', recordSealed: 'Record sealed purchase', recordSingles: 'Record singles purchase', recordUpgrade: 'Record upgrade spend',
    historyHelp: 'Dated events separate sealed cost, singles, upgrade spend, and sale proceeds. Unrealized gain is current estimate minus recorded cash basis.', sealedCost: 'Sealed cost', singlesUpgrades: 'Singles / upgrades', currentEstimate: 'Current estimate', unrealizedGain: 'Unrealized gain', saveEstimate: 'Save estimate', noEvents: 'No dated acquisition events yet. Record a purchase from the budget planner.',
    buildsHelp: 'Saved builds are versioned snapshots. Load one to restore its budget and play-style lane.', saveBudget: 'Save budget', saveFocused: 'Save focused', saveHigh: 'Save high power', loadBuild: 'Load build', additions: 'additions',
    english: 'English', spanish: 'Español', localeUrl: 'Saved in the URL as', currentValue: 'Current value', labelPrompt: 'Label', amountPrompt: 'Amount in USD',
  },
  es: {
    mission: 'Misión activa', import: 'Vista previa y conciliación', basket: 'Canasta de compra', reserve: 'Reservas de mazos', budget: 'Plan de presupuesto', history: 'Rendimiento de adquisiciones', builds: 'Construcciones guardadas', language: 'Idioma',
    missionProgress: 'Progreso local basado en eventos', complete: 'completo', waiting: 'esperando evento', approveTransfer: 'Aprobar evento de transferencia',
    importHelp: 'Cada fila debe revisarse antes de cambiar el inventario. Las impresiones exactas pueden aprobarse o rechazarse; los datos faltantes permanecen bloqueados.', selectFile: 'Seleccionar archivo ManaBox', added: 'agregadas', merged: 'combinadas', flagged: 'marcadas', rejected: 'rechazadas', approve: 'Aprobar', reject: 'Rechazar', applyRows: 'Aplicar solo filas aprobadas',
    basketHelp: 'Cartas faltantes de la línea de mejora actual, agrupadas por prioridad y precio de planificación.', core: 'Núcleo', wall: 'Conversión de Muros', high: 'Alto poder', basketTotal: 'Total estimado',
    reservationHelp: 'Las reservas respetan cantidades. El panel muestra copias escaneadas, asignadas y disponibles para otros mazos.', reserveCopy: 'Reservar una copia para Abzan Armor', releaseOne: 'Liberar una', noReservations: 'Aún no hay copias reservadas.', scanned: 'Escaneadas', allocated: 'Asignadas', available: 'Disponibles', noCopies: 'No hay copias escaneadas sin reservar.',
    budgetHelp: 'Compara tres formas de alcanzar el objetivo actual. El valor de transferencia es planificación, no gasto nuevo.', buyPrecon: 'Comprar este precon', buySingles: 'Comprar sueltas', transferSingles: 'Transferir + comprar', notRecorded: 'No registrado', recordSealed: 'Registrar compra sellada', recordSingles: 'Registrar compra de sueltas', recordUpgrade: 'Registrar gasto de mejora',
    historyHelp: 'Los eventos separan costo sellado, sueltas, mejoras y ventas. La ganancia no realizada es el valor actual menos el costo registrado.', sealedCost: 'Costo sellado', singlesUpgrades: 'Sueltas / mejoras', currentEstimate: 'Estimación actual', unrealizedGain: 'Ganancia no realizada', saveEstimate: 'Guardar estimación', noEvents: 'Aún no hay eventos de adquisición. Registra una compra desde el planificador.',
    buildsHelp: 'Las construcciones guardadas son instantáneas versionadas. Carga una para restaurar su presupuesto y estilo.', saveBudget: 'Guardar económica', saveFocused: 'Guardar enfocada', saveHigh: 'Guardar alto poder', loadBuild: 'Cargar construcción', additions: 'adiciones',
    english: 'English', spanish: 'Español', localeUrl: 'Guardado en la URL como', currentValue: 'Valor actual', labelPrompt: 'Etiqueta', amountPrompt: 'Monto en USD',
  },
} as const;

export type PortfolioMessages = typeof portfolioMessages.en;
