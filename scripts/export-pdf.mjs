// Regenerate public/Aditya-GTM-Engineering-Portfolio.pdf from the running
// site (http://localhost:3000). Run `npm start` first, then:
//   node scripts/export-pdf.mjs
import puppeteer from "puppeteer-core";

const OUT = "public/Aditya-GTM-Engineering-Portfolio.pdf";
const CLIENTS = ["Brex", "Rho", "Peec AI", "Warp", "Hyperbound", "Qashio"];

const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
// skip the boot intro; export always uses the light (parchment) theme
await page.evaluateOnNewDocument(() => {
  sessionStorage.setItem("booted", "1");
  localStorage.setItem("theme", "light");
});
await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
// wait for the CountUp springs to settle on their final values
await page.waitForFunction(
  () => {
    const t = document.querySelector(".hero .meta")?.textContent ?? "";
    return t.includes("40") && t.includes("100") && t.includes("25");
  },
  { timeout: 15000 }
);
await new Promise((r) => setTimeout(r, 1500));

// guard: the print-only client roster must exist and name all six clients
const rosterText = await page.evaluate(
  () => document.querySelector(".print-clients")?.textContent ?? ""
);
const missing = CLIENTS.filter((c) => !rosterText.includes(c));
if (missing.length) {
  await browser.close();
  console.error("ABORT — client roster missing:", missing.join(", "));
  process.exit(1);
}

await page.pdf({
  path: OUT,
  format: "Letter",
  printBackground: true,
  displayHeaderFooter: false,
});
await browser.close();
console.log(`wrote ${OUT} — all ${CLIENTS.length} clients present`);
