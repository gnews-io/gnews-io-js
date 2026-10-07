const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const GNews = require('../dist/index.js');
const { version } = require('../package.json');

const ARTICLE = {
  id: 'a1',
  title: 'Gold edges lower',
  description: 'Gold prices slipped.',
  content: 'Oct 7 (Reuters) - Gold prices slipped... [1862 chars]',
  url: 'https://www.reuters.com/a1',
  image: 'https://www.reuters.com/a1.jpg',
  publishedAt: '2026-10-07T04:46:07Z',
  lang: 'en',
  source: { id: 's1', name: 'Reuters', url: 'https://www.reuters.com', country: 'us' },
};
const OK = [200, { totalArticles: 54453, articles: [ARTICLE] }];

let server;
let baseUrl;
let responses = [];
let requests = [];

before(async () => {
  server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    requests.push({ path: url.pathname, query: Object.fromEntries(url.searchParams), headers: req.headers });
    const [status, body] = responses.shift();
    if (body === 'hang') return;
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v4`;
});

after(() => {
  server.closeAllConnections();
  server.close();
});

beforeEach(() => {
  requests = [];
});

function client(nextResponses, options = {}) {
  responses = [...nextResponses];
  const gnews = new GNews('test-key', { baseUrl, ...options });
  gnews.sleeps = [];
  gnews._sleep = async (ms) => { gnews.sleeps.push(ms); };
  return gnews;
}

test('search builds the request', async () => {
  await client([OK]).search('"Federal Reserve"', {
    lang: 'en',
    max: 10,
    in: 'title,description',
    from: new Date('2026-10-01T00:00:00Z'),
    to: '2026-10-07T00:00:00Z',
    sortby: 'relevance',
  });
  const [req] = requests;
  assert.equal(req.path, '/api/v4/search');
  assert.deepEqual(req.query, {
    apikey: 'test-key',
    q: '"Federal Reserve"',
    lang: 'en',
    max: '10',
    in: 'title,description',
    from: '2026-10-01T00:00:00.000Z',
    to: '2026-10-07T00:00:00Z',
    sortby: 'relevance',
  });
  assert.equal(req.headers['user-agent'], `gnews-io-js/${version}`);
});

test('search and topHeadlines work without params', async () => {
  const result = await client([OK, OK]).search('bitcoin');
  assert.equal(result.totalArticles, 54453);
  assert.equal(result.articles[0].source.name, 'Reuters');

  await client([OK]).topHeadlines();
  assert.equal(requests[1].path, '/api/v4/top-headlines');
});

test('topHeadlines sends category and skips null values', async () => {
  await client([OK]).topHeadlines({ category: 'business', country: 'us', lang: undefined, q: null });
  assert.deepEqual(requests[0].query, { apikey: 'test-key', category: 'business', country: 'us' });
});

test('API errors expose the API message and status', async () => {
  const cases = [
    [401, { errors: ['Invalid API Key provided.'] }, 'Invalid API Key provided.'],
    [400, { errors: { q: 'The query has a syntax error.' } }, 'q: The query has a syntax error.'],
    [403, { errors: ['You have reached your request limit for today.'] }, 'You have reached your request limit for today.'],
    [418, 'teapot', 'HTTP Error: 418'],
  ];
  for (const [status, body, message] of cases) {
    requests = [];
    const error = await client([[status, body]]).search('x').catch((e) => e);
    assert.ok(error instanceof GNews.GNewsError);
    assert.ok(error instanceof Error);
    assert.equal(error.message, message);
    assert.equal(error.status, status);
    assert.equal(requests.length, 1);
  }
});

test('retries rate limit and server errors', async () => {
  const gnews = client([[429, { errors: ['Too many requests.'] }], OK]);
  const result = await gnews.search('x');
  assert.equal(result.totalArticles, 54453);
  assert.equal(requests.length, 2);
  assert.equal(gnews.sleeps.length, 1);
  assert.ok(gnews.sleeps[0] >= 1000 && gnews.sleeps[0] < 2000);

  requests = [];
  const unavailable = [503, { errors: ['Maintenance.'] }];
  const error = await client([unavailable, unavailable, unavailable]).search('x').catch((e) => e);
  assert.equal(error.status, 503);
  assert.equal(requests.length, 3);

  requests = [];
  await client([[429, { errors: ['Too many requests.'] }]], { maxRetries: 0 }).search('x').catch(() => {});
  assert.equal(requests.length, 1);
});

test('timeouts and network errors raise GNewsError', async () => {
  const timeout = await client([[200, 'hang']], { maxWait: 50, maxRetries: 0 }).search('x').catch((e) => e);
  assert.ok(timeout instanceof GNews.GNewsError);
  assert.equal(timeout.message, 'Request timed out after 50ms');

  const gnews = new GNews('k', { baseUrl: 'http://127.0.0.1:9', maxRetries: 0 });
  const network = await gnews.search('x').catch((e) => e);
  assert.ok(network instanceof GNews.GNewsError);
  assert.match(network.message, /^Network error: /);
});

test('invalid responses raise GNewsError', async () => {
  for (const body of ['<html>maintenance</html>', { totalArticles: 1 }]) {
    const error = await client([[200, body]]).search('x').catch((e) => e);
    assert.ok(error instanceof GNews.GNewsError);
  }
});

test('validates constructor and query', async () => {
  assert.throws(() => new GNews(''), /API key is required/);
  assert.throws(() => new GNews('   '), /API key is required/);
  assert.throws(() => new GNews('k', { maxRetries: -1 }), /maxRetries/);
  await assert.rejects(new GNews('k').search(''), /Search query \(q\) is required/);
});
