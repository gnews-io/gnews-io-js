# GNews API JavaScript Client

Official JavaScript and TypeScript client for the [GNews API](https://gnews.io): search news articles and top headlines from 80,000+ sources in 41 languages.

- No runtime dependencies, Node.js 24+ (uses the built-in `fetch`)
- TypeScript types included
- Errors carry the API message and HTTP status
- Automatic retry on rate limit (429), server (5xx) and network errors

## Installation

```bash
npm i @gnews-io/gnews-io-js
```

Or with yarn:

```bash
yarn add @gnews-io/gnews-io-js
```

## Usage

```javascript
import GNews from '@gnews-io/gnews-io-js';
// or
const GNews = require('@gnews-io/gnews-io-js');

const client = new GNews('YOUR_API_KEY');
```

Get a free API key at [gnews.io/register](https://gnews.io/register).

### Search

```javascript
const response = await client.search('bitcoin', {
  lang: 'en',                         // language of the articles
  country: 'us',                      // country of the source
  max: 10,                            // articles per request, 1 to 100 depending on your plan
  in: 'title,description',            // fields to search
  from: new Date('2026-01-01'),       // Date or ISO 8601 string
  to: '2026-12-31T23:59:59Z',
  sortby: 'relevance',                // 'publishedAt' (default) or 'relevance'
});

console.log(`Found ${response.totalArticles} articles`);
for (const article of response.articles) {
  console.log(article.publishedAt, article.source.name, article.title);
}
```

The query supports quotes, `AND`, `OR`, `NOT` and parentheses: see the [query syntax](https://docs.gnews.io/endpoints/search-endpoint#query-syntax).

### Top headlines

```javascript
const response = await client.topHeadlines({
  category: 'technology',  // general (default), world, nation, business, technology,
                           // entertainment, sports, science, health
  lang: 'en',
  country: 'us',
  max: 10,
});
```

Both methods also accept `nullable`, `page` and `truncate`. See the [documentation](https://docs.gnews.io/) for every parameter.

## Response format

```javascript
{
  "totalArticles": 54904,
  "articles": [
    {
      "id": "b961dade95c55b7f949ccd8e0234a356",
      "title": "M5 chip leak reveals Apple has big gains coming in key area",
      "description": "Apple’s forthcoming M5 chip has seemingly leaked as part of a new iPad Pro hardware leak. Here’s what its performance looks like in testing.",
      "content": "Today, Apple’s as-yet-unannounced M5 iPad Pro was seemingly leaked by the same YouTuber who last year leaked the M4 MacBook Pro... [1862 chars]",
      "url": "https://9to5mac.com/2025/09/30/m5-chip-leak-reveals-apple-has-big-gains-coming-in-key-area/",
      "image": "https://i0.wp.com/9to5mac.com/wp-content/uploads/sites/6/2024/12/M5-Pro-chip-could-separate-CPU-and-GPU-in-server-grade-chips.jpg",
      "publishedAt": "2025-09-30T19:38:25Z",
      "lang": "en",
      "source": {
        "id": "92f73865e835e33ed68c11447777c939",
        "name": "9to5Mac",
        "url": "https://9to5mac.com",
        "country": "us"
      }
    }
  ]
}
```

`source.country` is only returned by `search`. On the Free plan, `content` is truncated.

## Error handling

API, network and timeout errors are thrown as `GNews.GNewsError`, which extends `Error` and exposes `status` (HTTP code, `undefined` for network errors and timeouts) and `errors` (the API error payload).

```javascript
try {
  await client.search('bitcoin');
} catch (error) {
  if (error instanceof GNews.GNewsError && error.status === 403) {
    console.log('Daily quota reached, it resets at 00:00 UTC');
  } else {
    console.error(error.message);  // e.g. "Invalid API Key provided."
  }
}
```

| Status | Cause |
|---|---|
| 400 | Invalid parameter or query syntax error |
| 401 | Invalid API key |
| 403 | Daily quota reached or subscription expired |
| 429 | Too many requests per second (1/s on Free, 10/s on paid plans) |
| 5xx | Server error or maintenance |

Rate limit, server and network errors are retried twice with a short randomized backoff (about 1 s, then 2 s) before throwing.

## Options

```javascript
const client = new GNews('YOUR_API_KEY', {
  maxWait: 10000,  // timeout per request in ms
  maxRetries: 2,   // retries on 429, 5xx and network errors
});
```

## TypeScript

Types are exported on the `GNews` namespace:

```typescript
import GNews from '@gnews-io/gnews-io-js';

const params: GNews.SearchParams = { lang: 'en', max: 5 };
const response: GNews.GNewsResponse = await client.search('bitcoin', params);
const first: GNews.Article = response.articles[0];
```

## Development

```bash
npm install
npm test
```

Releases: bump `version` in `package.json` and `VERSION` in `index.ts`, update `CHANGELOG.md`, then push a `vX.Y.Z` tag. The workflow stages the package on npm, and a maintainer approves it with 2FA in the Staged Packages tab on npmjs.com.

## License

MIT
