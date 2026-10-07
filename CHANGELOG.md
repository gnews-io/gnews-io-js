# Changelog

## 3.1.0 - 2026-10-07

- Fix error messages: errors now carry the API message (e.g. "Invalid API Key provided.") instead of "HTTP Error: 401".
- Fix `search(q)` crashing when called without a params object.
- Add `GNews.GNewsError` with `status` and `errors`, automatic retries on 429, 5xx and network errors (`maxRetries` option), and `Date` support for `from` and `to`.
- Fix TypeScript types: `sortby` accepts `publishedAt`, `topHeadlines` accepts `q`, `Article` includes `id`, `lang`, `source.id` and `source.country`. Types are now exported (`GNews.Article`, `GNews.SearchParams`...).
- Stop shipping the test file and the unused `undici-types` dependency.
