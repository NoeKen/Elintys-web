export const DISCOVERY_TYPES = ['all', 'event', 'vendor', 'venue'] as const;
export type DiscoveryType = (typeof DISCOVERY_TYPES)[number];

export interface DiscoveryQuery {
  q?: string;
  type: DiscoveryType;
  city?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  price?: string;
  capacity?: number;
  page: number;
}

type SearchParamValue = string | string[] | undefined;
export type DiscoverySearchParams = Record<string, SearchParamValue>;

const EVENT_CATEGORIES = new Set([
  'conference', 'wedding', 'gala', 'concert', 'festival', 'workshop',
  'corporate', 'birthday', 'networking', 'other',
]);
const VENDOR_CATEGORIES = new Set([
  'photographe', 'traiteur', 'decorateur', 'animateur', 'dj', 'sonorisation', 'autre',
]);
const VENUE_TYPES = new Set([
  'conference', 'reception', 'studio', 'restaurant', 'rooftop', 'spectacle', 'other',
]);
const PRICE_TIERS = new Set(['$', '$$', '$$$', '$$$$']);
const UTC_DATE = /^\d{4}-\d{2}-\d{2}$/;

function one(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function trimmed(value: SearchParamValue, max = 120): string | undefined {
  const result = one(value)?.trim().slice(0, max);
  return result || undefined;
}

function validDate(value: SearchParamValue): string | undefined {
  const candidate = one(value);
  if (!candidate || !UTC_DATE.test(candidate)) return undefined;
  const parsed = new Date(`${candidate}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === candidate
    ? candidate
    : undefined;
}

export function parseDiscoveryQuery(params: DiscoverySearchParams): DiscoveryQuery {
  const rawType = one(params.type);
  const type: DiscoveryType = DISCOVERY_TYPES.includes(rawType as DiscoveryType)
    ? rawType as DiscoveryType
    : 'all';
  const rawPage = Number.parseInt(one(params.page) ?? '1', 10);
  const page = Number.isFinite(rawPage) ? Math.min(Math.max(rawPage, 1), 10_000) : 1;
  const query: DiscoveryQuery = { type, page };
  const q = trimmed(params.q);
  if (q && q.length >= 2) query.q = q;

  if (type === 'event') {
    query.city = trimmed(params.city, 100);
    const category = one(params.category);
    if (category && EVENT_CATEGORIES.has(category)) query.category = category;
    const dateFrom = validDate(params.dateFrom);
    const dateTo = validDate(params.dateTo);
    if (dateFrom) query.dateFrom = dateFrom;
    if (dateTo && (!dateFrom || dateFrom <= dateTo)) query.dateTo = dateTo;
  }

  if (type === 'vendor') {
    query.city = trimmed(params.city, 100);
    const category = one(params.category);
    if (category && VENDOR_CATEGORIES.has(category)) query.category = category;
    const price = one(params.price);
    if (price && PRICE_TIERS.has(price)) query.price = price;
  }

  if (type === 'venue') {
    query.city = trimmed(params.city, 100);
    const category = one(params.category);
    if (category && VENUE_TYPES.has(category)) query.category = category;
    const rawCapacity = Number(one(params.capacity));
    if (Number.isInteger(rawCapacity) && rawCapacity > 0 && rawCapacity <= 100_000) {
      query.capacity = rawCapacity;
    }
  }

  return query;
}

function toParams(query: DiscoveryQuery, includeLimit = false): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.type !== 'all') params.set('type', query.type);
  if (query.city) params.set('city', query.city);
  if (query.category) params.set('category', query.category);
  if (query.dateFrom) params.set('dateFrom', query.dateFrom);
  if (query.dateTo) params.set('dateTo', query.dateTo);
  if (query.price) params.set('price', query.price);
  if (query.capacity) params.set('capacity', String(query.capacity));
  params.set('page', String(query.page));
  if (includeLimit) params.set('limit', '12');
  return params;
}

export function buildDiscoveryApiPath(query: DiscoveryQuery): string | null {
  if (query.type === 'all') {
    if (!query.q) return null;
    const params = new URLSearchParams({ q: query.q, page: String(query.page), limit: '12' });
    return `/discovery/search?${params.toString()}`;
  }

  const params = toParams(query, true);
  params.delete('type');
  if ((query.type === 'event' || query.type === 'venue') && query.category) {
    params.delete('category');
    params.set('type', query.category);
  }
  const endpoint = query.type === 'event' ? 'events' : query.type === 'vendor' ? 'vendors' : 'venues';
  return `/discovery/${endpoint}?${params.toString()}`;
}

export function buildDiscoveryHref(
  current: DiscoveryQuery,
  patch: Partial<DiscoveryQuery>,
): string {
  const next = parseDiscoveryQuery({
    ...Object.fromEntries(toParams(current)),
    ...Object.fromEntries(
      Object.entries(patch).map(([key, value]) => [key, value === undefined ? undefined : String(value)]),
    ),
    page: String('page' in patch ? patch.page ?? 1 : 1),
  });
  const params = toParams(next);
  if (next.type === 'all') params.delete('type');
  if (params.get('page') === '1' && !('page' in patch) && Object.keys(patch).length === 0) {
    params.delete('page');
  }
  const search = params.toString();
  return `/evenements/recherche${search ? `?${search}` : ''}`;
}
