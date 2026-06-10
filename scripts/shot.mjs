// Dev tool: drive the installed Chrome to screenshot the running site.
// Usage: node scripts/shot.mjs [width height outPrefix]
import puppeteer from "puppeteer-core";

const [w = 1440, h = 900, prefix = "shot"] = process.argv.slice(2);

const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
});
const page = await browser.newPage();
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 2500));

const stops = [
  ["hero", 0],
  ["marquee", "marqueeY"],
  ["signals", "signalsY"],
  ["case1", "case1Y"],
  ["case4", "case4Y"],
  ["grid", "gridY"],
  ["footer", "footerY"],
];

const ys = await page.evaluate(() => {
  const y = (sel) => {
    const el = document.querySelector(sel);
    return el ? Math.max(0, el.getBoundingClientRect().top + scrollY - 80) : 0;
  };
  return {
    marqueeY: y(".marquee"),
    signalsY: y(".signals") - 120,
    case1Y: y(".case"),
    case4Y: y(".case:nth-of-type(1) ~ * .data") || 0,
    gridY: y(".grid") - 140,
    footerY: y("footer"),
  };
});

for (const [name, pos] of stops) {
  const yy = typeof pos === "string" ? ys[pos] : pos;
  await page.evaluate((v) => window.scrollTo(0, v), yy);
  await new Promise((r) => setTimeout(r, 1600));
  await page.screenshot({ path: `/tmp/${prefix}-${name}.png` });
}
await browser.close();
console.log("done");
