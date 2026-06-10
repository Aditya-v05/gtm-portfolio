import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => sessionStorage.setItem("booted", "1")); // skip boot for theme shots
await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 2500));
await page.screenshot({ path: "/tmp/light-hero.png" });
await page.evaluate(() => document.querySelector(".evwall").scrollIntoView({ block: "center" }));
await new Promise(r => setTimeout(r, 1800));
await page.screenshot({ path: "/tmp/light-wall.png" });
await page.evaluate(() => document.querySelector(".case .term").scrollIntoView({ block: "center" }));
await new Promise(r => setTimeout(r, 1200));
await page.screenshot({ path: "/tmp/light-case.png" });
// flip to dark via the toggle
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 800));
await page.click(".modebtn");
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: "/tmp/dark-hero.png" });
await browser.close();
console.log("done");
