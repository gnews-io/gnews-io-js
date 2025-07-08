declare class GNews {
  /**
   * Creates a new GNews client
   * @param apiKey - Your GNews.io API key
   * @param options - Additional configuration options
   */
  constructor(
      apiKey: string,
      options?: {
        version?: string;
        maxWait?: number;
      }
  );

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
  headlines(params?: {
    lang?: string;
    country?: string;
    max?: number
    category?: 'general' | 'world' | 'nation' | 'business' | 'technology' | 'entertainment' | 'sports' | 'science' | 'health';
    in?: string;
    nullable?: string;
    from?: string;
    to?: string;
    page?: number;
    expand?: string;
  }): Promise<GNewsResponse>;

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
  search(q: string, params: {
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
  }): Promise<GNewsResponse>;
}

interface GNewsResponse {
  totalArticles: number;
  articles: Article[];
}

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

export { GNewsResponse, Article };
export default GNews;
