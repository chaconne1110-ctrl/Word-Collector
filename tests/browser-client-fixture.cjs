// Install test-only client setup before the separate review page auto-starts.
// Functions/data passed here are deterministic mocks; no billable API calls.
async function setupAnalysisClient(page, setup) {
  await page.route('**/analysis-api.js', async route => {
    const response = await route.fetch();
    await route.fulfill({response, body:(await response.text()) + '\n;(' + setup.toString() + ')();'});
  });
}
module.exports = {setupAnalysisClient};
