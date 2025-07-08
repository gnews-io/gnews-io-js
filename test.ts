/**
 * GNews.js Client Test Script
 * Run with: node test.js YOUR_API_KEY
 */

// Import our library (from local code, not npm)
const GNews = require('./dist/index');

// Get API key from command line argument
const API_KEY = process.argv[2];

if (!API_KEY) {
  console.error('Error: API key is required');
  console.log('Usage: node test.js YOUR_API_KEY');
  process.exit(1);
}

// Get current date for testing
const currentDate = new Date();
const formattedDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
console.log(`Current date: ${formattedDate}`);

// Create a new GNews instance
const gnews = new GNews(API_KEY);

// Test function to run multiple API calls
async function runTests() {
  console.log('Starting GNews.js Client tests...');
  console.log('===================================');

  // Test 1: Headlines
  try {
    console.log('\n🔍 Testing headlines() method...');
    const headlines = await gnews.headlines({
      lang: 'en',
      max: 2
    });

    if (headlines && headlines.articles && headlines.articles.length > 0) {
      console.log(`✅ SUCCESS: Headlines received (${headlines.totalArticles} total articles)`);
      console.log(`📰 First headline: ${headlines.articles[0].title}`);
      console.log(`🔗 URL: ${headlines.articles[0].url}`);
    } else {
      console.log('❌ FAILED: No headlines received or invalid format');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ FAILED: Headlines test failed:', error.message);
    }
  }

  // Test 2: Search
  try {
    console.log('\n🔍 Testing search() method with query "technology"...');
    const search = await gnews.search('technology', {
      lang: 'en',
      max: 2,
      from: formattedDate
    });

    if (search && search.articles && search.articles.length > 0) {
      console.log(`✅ SUCCESS: Search results received (${search.totalArticles} total articles)`);
      console.log(`📰 First result: ${search.articles[0].title}`);
      console.log(`🔗 URL: ${search.articles[0].url}`);
    } else {
      console.log('❌ FAILED: No search results received or invalid format');
    }
  }
  catch (error) {
    if (error instanceof Error) {
      console.error('❌ FAILED: Search test failed:', error.message);
    }
  }

  // Test 3: Error handling (invalid API key)
  try {
    console.log('\n🔍 Testing error handling with invalid API key...');
    const invalidClient = new GNews('invalid_api_key_for_testing');
    await invalidClient.headlines({
      lang: 'en',
      max: 1
    });
    console.error('❌ FAILED: Error handling test failed - Should have thrown an error');
  } catch (error) {
    if (error instanceof Error) {
      console.log('✅ SUCCESS: Error handling works correctly:', error.message);
    }
  }

  // Test 4: Request parameters
  try {
    console.log('\n🔍 Testing request parameter handling...');
    // Test with various parameters to ensure they're handled correctly
    const params = {
      lang: 'en',
      country: 'us',
      max: 1,
      category: 'technology'
    };

    const response = await gnews.headlines(params);

    if (response && response.articles && response.articles.length > 0) {
      console.log('✅ SUCCESS: Parameter handling works correctly');
    } else {
      console.log('❌ FAILED: Parameter handling test failed');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ FAILED: Parameter handling test failed:', error.message);
    }
  }

  console.log('\n===================================');
  console.log('All tests completed!');
}

runTests();