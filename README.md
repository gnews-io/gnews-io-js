# GNews.io JS Client

A simple JavaScript wrapper for the [GNews.io](https://gnews.io) API. This library provides a clean interface for fetching news articles.

## Documentation

- [GNews.io API Documentation](https://gnews.io/docs/v4#introduction)

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

### Initialize

```javascript
const client = new GNews('YOUR_API_KEY');
```

### Get Top Headlines

```javascript
// Get top headlines
client.topHeadlines({
  lang: 'en',            // optional, article language
  country: 'us',         // optional, article country
  max: 10,               // optional, number of articles to return
  category: 'technology' // optional, article category
})
.then(response => {
  console.log(`Found ${response.totalArticles} articles`);
  console.log(response.articles);
})
.catch(error => {
  console.error(error);
});
```

### Search Articles

```javascript
// Search for articles
client.search('bitcoin', {
  lang: 'en',         // optional, article language
  country: 'us',      // optional, article country
  max: 10,            // optional, number of articles to return
  in: 'title',        // optional, search in title, description, content
  from: '2025-01-01', // optional, start date
  to: '2025-12-31',   // optional, end date
  sortby: 'relevance' // optional, sort by relevance, date, or publish-time
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
  totalArticles: 123,
  articles: [
    {
      title: "Article title",
      description: "Article description",
      content: "Article content...",
      url: "https://article-source.com/article",
      image: "https://article-source.com/image.jpg",
      publishedAt: "2025-01-01T12:00:00Z",
      source: {
        name: "Source Name",
        url: "https://source-website.com"
      }
    },
    // More articles...
  ]
}
```

## Error Handling

The library throws errors in the following cases:
- Missing API key during initialization
- Network errors
- API request timeouts
- API error responses
