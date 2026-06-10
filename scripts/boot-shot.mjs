import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: "/tmp/boot-mid.png" });
await new Promise(r => setTimeout(r, 700));
await page.screenshot({ path: "/tmp/boot-end.png" });
await new Promise(r => setTimeout(r, 2500));
await page.screenshot({ path: "/tmp/boot-after.png" });
// cursor lock-on: hover a nav link
await page.mouse.move(1098, 25);
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: "/tmp/cursor-nav.png", clip: { x: 950, y: 0, width: 490, height: 60 } });
await browser.close();
console.log("done");
