import puppeteer from "puppeteer-core";
const sites = [
  ["evolve", "https://madeinevolve.com/"],
  ["lightweight", "https://lightweight.info/en"],
  ["osmo", "https://www.osmo.supply/"],
  ["flabbergast", "https://flabbergast.agency/"],
];
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
for (const [name, url] of sites) {
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: `/tmp/ref-${name}-1.png` });
    await page.evaluate(() => window.scrollBy({ top: 1400, behavior: "instant" }));
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: `/tmp/ref-${name}-2.png` });
    await page.evaluate(() => window.scrollBy({ top: 1800, behavior: "instant" }));
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: `/tmp/ref-${name}-3.png` });
    await page.close();
    console.log(name, "ok");
  } catch (e) { console.log(name, "FAIL", e.message.slice(0, 80)); }
}
await browser.close();
