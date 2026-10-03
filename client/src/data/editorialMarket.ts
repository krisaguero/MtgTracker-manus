export interface EditorialMover { id: string; category: string; name: string; setName: string; printing: string; price: number; changePercent: number; formats: string; thesis: string; confidence: string; risk: string; }
export interface EditorialArticle { slug: string; kicker: string; title: string; dek: string; body: string[]; }
export interface EditorialPayload { snapshot: { date: string; label: string; source: string; dataWindow: string; marketStatus: string }; movers: EditorialMover[]; articles: Record<string, EditorialArticle>; }
