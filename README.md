# GNews API JavaScript Client

A simple JavaScript wrapper for [GNews API](https://gnews.io). This library provides a clean interface for fetching news articles.

## Documentation

- [GNews API Documentation](https://docs.gnews.io/)

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
```

### Initialization

```javascript
const client = new GNews('YOUR_API_KEY');
```

### Search Endpoint

```javascript
// Search for articles
client.search('bitcoin', {
  lang: 'en',                   // Optional, languages of articles 
  country: 'us',                // Optional, country of origin of the source
  max: 10,                      // Optional, maximum number of articles to be returned
  from: '2025-01-01T00:00:00Z', // Optional, minimum publication date (included)
  to: '2025-12-31T23:59:59Z',   // Optional, maximum publication date (included)
  // ..., any additional parameter specified in the documentation (see https://docs.gnews.io)
})
.then(response => {
  console.log(`Found ${response.totalArticles} articles`);
  console.log(response.articles);
})
.catch(error => {
  console.error(error);
});
```

### Top Headlines Endpoint

```javascript
// Get the top headlines
client.topHeadlines({
  category: 'technology'        // Optional, desired category
  lang: 'en',                   // Optional, languages of articles
  country: 'us',                // Optional, country of origin of the source
  max: 10,                      // Optional, maximum number of articles to be returned
  // ..., any additional parameter specified in the documentation (see https://docs.gnews.io)
})
.then(response => {
  console.log(`Found ${response.totalArticles} articles`);
  console.log(response.articles);
})
.catch(error => {
  console.error(error);
});
```

## Response Format

All API methods return promises that resolve to objects with the following structure:

```javascript
{
  "totalArticles": 54904,
  "articles": [
    {
      "id": "b961dade95c55b7f949ccd8e0234a356",
      "title": "M5 chip leak reveals Apple has big gains coming in key area",
      "description": "Apple’s forthcoming M5 chip has seemingly leaked as part of a new iPad Pro hardware leak. Here’s what its performance looks like in testing.",
      "content": "Today, Apple’s as-yet-unannounced M5 iPad Pro was seemingly leaked by the same YouTuber who last year leaked the M4 MacBook Pro. Thanks to the surprise reveal, we now have benchmarks for Apple’s forthcoming M5 chip, and they point to big gains coming... [1862 chars]",
      "url": "https://9to5mac.com/2025/09/30/m5-chip-leak-reveals-apple-has-big-gains-coming-in-key-area/",
      "image": "https://i0.wp.com/9to5mac.com/wp-content/uploads/sites/6/2024/12/M5-Pro-chip-could-separate-CPU-and-GPU-in-server-grade-chips.jpg?resize=1200%2C628&quality=82&strip=all&ssl=1",
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

## Error Handling

The library throws errors in the following cases:
- Missing API key during initialization
- Network errors
- API request timeouts
- API error responses
