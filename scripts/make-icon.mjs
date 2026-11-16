// Draws the site's icon: one span of the aqueduct at night-blue, water in its channel, a fall through the left
// arch and the sea below. Writes app/icon.svg (the browser tab) and app/apple-icon.png (home screens).
//   node scripts/make-icon.mjs
import puppeteer from "puppeteer-core";
import { writeFileSync } from "node:fs";

const COL = { N: "#1b2b5a", S: "#f6ead9", s: "#d6bea2", W: "#8aa5e0", H: "#eef1fa", B: "#5574c2", b: "#3f5cab" };
const ART = [
  ".NNNNNNNNNNNNNN.",
  "NNNNNNNNNNNNNNNN",
  "NNNNNNNNNNNNNNNN",
  "WWHWWWWWWHHWWWWW",
  "SSSSSSSSSSSSSSSS",
  "SsSNHNSSsSNNNSSs",
  "SsNNWNNSsNNNNNSs",
  "SsNNWNNSsNNNNNSs",
  "SsNNHNNSsNNNNNSs",
  "SsNNWNNSsNNNNNSs",
  "SsNNWNNSsNNNNNSs",
  "SsNNHNNSsNNNNNSs",
  "BBBHHHBBBBBBHHBB",
  "BBBBBBBBHHBBBBBB",
  "bBBBBBBBBBBBBBBb",
  ".bbbbbbbbbbbbbb.",
];
const svg = (full) => {
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">`;
  ART.forEach((row, y) => {
    // one rect per run of the same colour
    for (let x = 0; x < 16; ) {
      let ch = row[x], n = 1;
      while (x + n < 16 && row[x + n] === ch) n++;
      if (ch === "." && full) ch = y < 8 ? "N" : "b"; // home-screen icons have no clear corners
      if (ch !== ".") out += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${COL[ch]}"/>`;
      x += n;
    }
  });
  return out + "</svg>";
};
writeFileSync("app/icon.svg", svg(false) + "\n");

const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 180, height: 180 });
await page.setContent(`<body style="margin:0"><div style="width:180px;height:180px">${svg(true).replace("<svg ", '<svg width="180" height="180" ')}</div></body>`);
writeFileSync("app/apple-icon.png", await page.screenshot({ type: "png" }));
await browser.close();
console.log("wrote app/icon.svg and app/apple-icon.png");
