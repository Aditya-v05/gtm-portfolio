import puppeteer from "/Users/adi/Projects/clay-portfolio/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import { readFileSync, writeFileSync } from "node:fs";
const b=await puppeteer.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:"new"});
const p=await b.newPage(); await p.goto("http://localhost:3001/nope");
const data=readFileSync("art-src/hydra.gif").toString("base64");
const info=await p.evaluate(async(b64)=>{
  const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
  const dec=new ImageDecoder({data:bytes,type:"image/gif"}); await dec.tracks.ready; const n=dec.tracks.selectedTrack.frameCount;
  const frames=[]; for(let i=0;i<n;i++){const r=await dec.decode({frameIndex:i}); frames.push(r.image);}
  const w=frames[0].displayWidth,h=frames[0].displayHeight;
  const pick=[...Array(n).keys()];
  const c=document.createElement("canvas"); c.width=w*pick.length; c.height=h; const g=c.getContext("2d");
  pick.forEach((f,i)=>g.drawImage(frames[f],i*w,0));
  const px=g.getImageData(0,0,3,3).data;
  return {n,w,h,durs:frames.slice(0,6).map(f=>f.duration),corner:[...px.slice(0,4)],url:c.toDataURL("image/png")};
},data);
writeFileSync("public/art/hydra.png",Buffer.from(info.url.split(",")[1],"base64")); delete info.url; console.log(JSON.stringify(info)); await b.close();
