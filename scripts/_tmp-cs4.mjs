import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--use-gl=angle"] });
for (const [w,h] of [[1440,900],[1920,1080],[1280,800],[1512,982],[390,844]]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await p.evaluateOnNewDocument(()=>{ try{ sessionStorage.setItem("booted","1"); sessionStorage.setItem("heroDone","1"); }catch(e){} });
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle0" });
  await new Promise(r=>setTimeout(r,3000));
  const res = await p.evaluate(() => new Promise(res => {
    let nx=0, ny=0, n=0;
    const id = setInterval(() => {
      const st = window.__plant, bnd = window.__bounds;
      if (st && bnd && !st.truckMoving) { nx=Math.max(nx,bnd.nx); ny=Math.max(ny,bnd.ny); }
      if (++n>=170) { clearInterval(id); res({ nx, ny }); }
    }, 100);
  }));
  console.log(w+"x"+h, "nx", res.nx.toFixed(3), "ny", res.ny.toFixed(3), (res.nx<=1.02&&res.ny<=1.02)?"FITS":"over");
  await p.close();
}
await b.close();
