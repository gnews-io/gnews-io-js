const VERSION = '3.1.0';
const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);

/**
 * GNews API client. See https://docs.gnews.io
 */
class GNews {
  apiKey: string;
  version: string;
  maxWait: number;
  maxRetries: number;
  baseUrl: string;

  /**
   * @param apiKey - Your GNews API key (https://gnews.io/register)
   */
  constructor(apiKey: string, options: GNews.Options = {}) {
    const key = typeof apiKey === 'string' ? apiKey.trim() : '';
    if (!key) {
      throw new Error('API key is required');
    }
    const maxRetries = options.maxRetries ?? 2;
    if (!Number.isInteger(maxRetries) || maxRetries < 0) {
      throw new Error('maxRetries must be an integer >= 0');
    }

    this.apiKey = key;
    this.version = options.version || 'v4';
    this.maxWait = options.maxWait || 10000;
    this.maxRetries = maxRetries;
    this.baseUrl = (options.baseUrl || `https://gnews.io/api/${this.version}`).replace(/\/+$/, '');
  }

  /**
   * Search articles by keywords. See https://docs.gnews.io/endpoints/search-endpoint
   */
  async search(q: string, params: GNews.SearchParams = {}): Promise<GNews.GNewsResponse> {
    if (!q) {
      throw new Error('Search query (q) is required');
    }
    return this._request('/search', { ...params, q });
  }

  /**
   * Trending articles by category. See https://docs.gnews.io/endpoints/top-headlines-endpoint
   */
  async topHeadlines(params: GNews.TopHeadlinesParams = {}): Promise<GNews.GNewsResponse> {
    return this._request('/top-headlines', params);
  }

  private async _request(endpoint: string, params: object): Promise<GNews.GNewsResponse> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    // Query string rather than the X-Api-Key header: the API's CORS preflight doesn't allow that header
    url.searchParams.append('apikey', this.apiKey);
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value instanceof Date ? value.toISOString() : String(value));
      }
    }
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (typeof window === 'undefined') {
      headers['User-Agent'] = `gnews-io-js/${VERSION}`;
    }

    for (let attempt = 0; ; attempt++) {
      let response: Response;
      try {
        response = await fetch(url, { headers, signal: AbortSignal.timeout(this.maxWait) });
      } catch (error) {
        if (attempt >= this.maxRetries) {
          throw networkError(error, this.maxWait);
        }
        await this._sleep(retryDelay(attempt));
        continue;
      }

      if (response.ok) {
        return parseResponse(await response.text());
      }
      if (!RETRY_STATUSES.has(response.status) || attempt >= this.maxRetries) {
        throw await apiError(response);
      }
      await response.body?.cancel();
      await this._sleep(retryDelay(attempt));
    }
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

namespace GNews {
  export type Category =
    | 'general' | 'world' | 'nation' | 'business' | 'technology'
    | 'entertainment' | 'sports' | 'science' | 'health';

  export type DateLike = string | Date;

  export interface Options {
    /** API version (default: 'v4') */
    version?: string;
    /** Timeout per request in ms (default: 10000) */
    maxWait?: number;
    /** Retries on rate limit (429), server (5xx) and network errors (default: 2) */
    maxRetries?: number;
    /** Overrides https://gnews.io/api/{version} */
    baseUrl?: string;
  }

  interface CommonParams {
    /** 2-letter language code, e.g. 'en' */
    lang?: string;
    /** 2-letter country code, e.g. 'us' */
    country?: string;
    /** Articles per request, 1 to 100 depending on your plan (default: 10) */
    max?: number;
    /** Fields allowed to be null: 'description', 'content', 'image' (comma-separated) */
    nullable?: string;
    /** Minimum publication date: Date or ISO 8601 string */
    from?: DateLike;
    /** Maximum publication date: Date or ISO 8601 string */
    to?: DateLike;
    /** Page number, starts at 1 */
    page?: number;
    /** 'content' to truncate the content attribute */
    truncate?: 'content';
    /** @deprecated Not a documented API parameter */
    expand?: string;
  }

  export interface SearchParams extends CommonParams {
    /** Fields to search: 'title', 'description', 'content' (comma-separated) */
    in?: string;
    /** 'publishedAt' (default) or 'relevance'. 'date' and 'publish-time' are kept for compatibility only */
    sortby?: 'publishedAt' | 'relevance' | 'date' | 'publish-time';
    /** @deprecated Pass the query as the first argument of search() */
    q?: string;
  }

  export interface TopHeadlinesParams extends CommonParams {
    /** Default: 'general' */
    category?: Category;
    /** Keywords, see https://docs.gnews.io/endpoints/search-endpoint#query-syntax */
    q?: string;
    /** @deprecated Ignored by the top-headlines endpoint */
    in?: string;
    /** @deprecated Ignored by the top-headlines endpoint */
    sortby?: 'publishedAt' | 'relevance' | 'date' | 'publish-time';
  }

  export interface Article {
    id: string;
    title: string;
    description: string;
    content: string;
    url: string;
    image: string;
    /** ISO 8601, UTC */
    publishedAt: string;
    lang: string;
    source: {
      id: string;
      name: string;
      url: string;
      /** Only returned by the search endpoint */
      country?: string;
    };
  }

  export interface GNewsResponse {
    totalArticles: number;
    articles: Article[];
  }

  export class GNewsError extends Error {
    /** HTTP status code, undefined for network errors and timeouts */
    readonly status?: number;
    /** Error payload returned by the API */
    readonly errors?: unknown;

    constructor(message: string, status?: number, errors?: unknown) {
      super(message);
      this.name = 'GNewsError';
      this.status = status;
      this.errors = errors;
    }
  }
}

function retryDelay(attempt: number): number {
  // Jitter so concurrent clients hitting the per-second limit don't retry in sync
  return 2 ** attempt * 1000 + Math.random() * 1000;
}

function parseResponse(body: string): GNews.GNewsResponse {
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    throw new GNews.GNewsError('Invalid response from the API: not JSON');
  }
  if (typeof data !== 'object' || data === null || !Array.isArray((data as GNews.GNewsResponse).articles)) {
    throw new GNews.GNewsError('Invalid response from the API: missing articles');
  }
  return data as GNews.GNewsResponse;
}

async function apiError(response: Response): Promise<GNews.GNewsError> {
  let errors: unknown;
  try {
    errors = (await response.json()).errors;
  } catch {
    errors = undefined;
  }
  let message = `HTTP Error: ${response.status}`;
  if (Array.isArray(errors) && errors.length > 0) {
    message = errors.join('; ');
  } else if (errors && typeof errors === 'object') {
    message = Object.entries(errors).map(([key, value]) => `${key}: ${value}`).join('; ');
  }
  return new GNews.GNewsError(message, response.status, errors);
}

function networkError(error: unknown, maxWait: number): GNews.GNewsError {
  if (error instanceof Error && error.name === 'TimeoutError') {
    return new GNews.GNewsError(`Request timed out after ${maxWait}ms`);
  }
  const message = error instanceof Error ? error.message : String(error);
  return new GNews.GNewsError(`Network error: ${message}`);
}

export = GNews;

if (typeof window !== 'undefined') {
  (window as any).GNews = GNews;
}
