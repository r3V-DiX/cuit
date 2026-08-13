// Screenshot the employer subscription page at desktop + mobile widths.
// Usage: node scripts/shot-subscription.js <sessionToken>
const { chromium } = require("playwright-core");

(async () => {
  const token = process.argv[2];
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });

  const shots = [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "mobile", width: 390, height: 844 },
    { name: "tablet", width: 820, height: 1180 },
  ];

  for (const s of shots) {
    const ctx = await browser.newContext({
      viewport: { width: s.width, height: s.height },
      storageState: undefined,
    });
    // Set session cookie for both possible hostnames so the proxy sees it.
    await ctx.addCookies([
      { name: "session_token", value: token, domain: "localhost", path: "/" },
      { name: "user_role", value: "EMPLOYER", domain: "localhost", path: "/" },
      { name: "session_token", value: token, domain: "127.0.0.1", path: "/" },
      { name: "user_role", value: "EMPLOYER", domain: "127.0.0.1", path: "/" },
    ]);
    const page = await ctx.newPage();
    await page.goto("http://127.0.0.1:3000/employer/subscription", {
      waitUntil: "networkidle",
      timeout: 30000,
    }).catch(() => {});
    // Let the client-side tab bar + cards render (APIs need time)
    await page.waitForTimeout(8000);
    await page.screenshot({ path: `/tmp/subscription-${s.name}.png`, fullPage: true });
    console.log(`shot: ${s.name} (${s.width}x${s.height})`);
    await ctx.close();
  }

  await browser.close();
})();
