interface Article {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

interface GNewsResponse {
  totalArticles: number;
  articles: Article[];
}

/**
 * GNews.io API Client Library
 * A simple wrapper for the GNews.io API
 */
class GNews {
  apiKey: string;
  version: string;
  maxWait: number;
  baseUrl: string;

  /**
   * Creates a new GNews client
   * @param {string} apiKey - Your GNews.io API key
   * @param {Object} options - Additional configuration options
   * @param {string} options.version - API version (default: 'v4')
   * @param {number} options.maxWait - Maximum time to wait for a response in ms (default: 10000)
   */
  constructor(apiKey: string, options: { version?: string; maxWait?: number } = {}) {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    this.apiKey = apiKey;
    this.version = options.version || 'v4';
    this.maxWait = options.maxWait || 10000;
    this.baseUrl = `https://gnews.io/api/${this.version}`;
  }

  /**
   * Make a request to the GNews API
   * @private
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Promise resolving to API response
   */
  private async _request(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    // Add API key to all requests
    url.searchParams.append('apikey', this.apiKey);

    // Add all other parameters
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.maxWait);

      const response = await fetch(url.toString(), { signal: controller.signal });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error: ${response.status}`);
      }

      return await response.json() as GNewsResponse;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${this.maxWait}ms`);
      }
      throw error;
    }
  }

  /**
   * Get top news headlines
   * @param {Object} params - Query parameters
   * @param {string} params.lang - Article language (e.g., 'en')
   * @param {string} params.country - Article country (e.g., 'us')
   * @param {number} params.max - Maximum number of articles to return
   * @param {string} params.category - News category (top, world, nation, business, technology, entertainment, sports, science, health)
   * @param {string} params.in - Where to search (title, description, content)
   * @param {string} params.nullable - Fields that can be null
   * @param {string} params.from - Start date in 'YYYY-MM-DD' format
   * @param {string} params.to - End date in 'YYYY-MM-DD' format
   * @param {number} params.page - (paid subscription) Page number for pagination
   * @param {string} params.expand - (paid subscription) Expand articles content
   * @returns {Promise<Object>} - Promise resolving to headlines response
   */
  async headlines(params: {
    lang?: string;
    country?: string;
    max?: number;
    category?: 'general' | 'world' | 'nation' | 'business' | 'technology' | 'entertainment' | 'sports' | 'science' | 'health';
    in?: string;
    nullable?: string;
    from?: string;
    to?: string;
    sortby?: 'relevance' | 'date' | 'publish-time';
    page?: number;
    expand?: string;
  }): Promise<GNewsResponse> {
    return this._request('/top-headlines', params);
  }

  /**
   * Search for news articles
   * @param {string} q - Search query (required)
   * @param {Object} params - Query parameters
   * @param {string} params.lang - Article language (e.g., 'en')
   * @param {string} params.country - Article country (e.g., 'us')
   * @param {number} params.max - Maximum number of articles to return
   * @param {string} params.in - Where to search (title, description, content)
   * @param {string} params.nullable - Fields that can be null
   * @param {string} params.from - Start date in 'YYYY-MM-DD' format
   * @param {string} params.to - End date in 'YYYY-MM-DD' format
   * @param {string} params.sortby - Sort articles by (relevance, date, publish-time)
   * @param {number} params.page - (paid subscription) Page number for pagination
   * @param {string} params.expand - (paid subscription) Expand articles content
   * @returns {Promise<Object>} - Promise resolving to search response
   */
  async search(q: string, params: {
    q?: string;
    lang?: string;
    country?: string;
    max?: number;
    in?: string;
    nullable?: string;
    from?: string;
    to?: string;
    sortby?: 'relevance' | 'date' | 'publish-time';
    page?: number;
    expand?: string;
  }): Promise<GNewsResponse> {
    if (!q) {
      throw new Error('Search query (q) is required');
    }
    params.q = q;

    return this._request('/search', params);
  }
}

// Export pour Node.js (CommonJS)
export = GNews;

// Pour le navigateur
if (typeof window !== 'undefined') {
  (window as any).GNews = GNews;
}