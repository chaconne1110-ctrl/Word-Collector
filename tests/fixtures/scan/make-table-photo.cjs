// Builds tests/fixtures/scan/table-photo.jpg: a phone-like photo of a printed word table
// (English words, Korean handwriting-like text, red pen circles) whose lower part is in
// shadow. One black/white cut-off for the whole picture loses the shaded rows; the local
// (Sauvola) cut-off reads them. Used by scan-words-browser.cjs.
// Run: CHROMIUM_PATH=<chromium or msedge> node tests/fixtures/scan/make-table-photo.cjs
const path=require('path');const fs=require('fs');const out=require('path').join(__dirname,'table-photo.jpg');
const {chromium}=require('playwright');
const W1=['Photodiode','Semiconductor','Bandgap','Graphene','Substrate','Junction','Electrode','Photocurrent','Capacitance','Inductor'];
const W2=['absorb','converted','apply','influence','modification','incoming','illumination','subtracting','suppresses','filtering'];
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
const m=await b.newPage({viewport:{width:1500,height:2000}});
const rows=(ws,h)=>ws.map((w,i)=>`<tr style="height:${h}px"><td style="border:1.5px solid #444;padding:0 12px">${w}</td><td style="border:1.5px solid #444;position:relative"><span style="font:italic 34px 'Malgun Gothic';color:#333;margin-left:60px">${['광다이오드','반도체','밴드갭','그래핀','기판','접합','전극','광전류','정전용량','인덕터','흡수하다','전환되다','적용하다','영향','수정','들어오는','조명','빼기','억제','필터링'][i+(ws===W2?10:0)]}</span><span style="position:absolute;left:${110+i*7}px;top:4px;width:70px;height:${h-8}px;border:3px solid #d22;border-radius:50%;transform:rotate(-12deg)"></span></td><td style="border:1.5px solid #444;width:520px"></td></tr>`).join('');
await m.setContent(`<!doctype html><body style="margin:0;background:#eef0f3"><style>td{font:30px Arial,sans-serif;color:#222}</style><div style="position:absolute;inset:0;padding:120px 40px;font:30px Arial,sans-serif;color:#222;transform:rotate(-0.8deg)">
<div style="font:bold 44px 'Malgun Gothic';margin-bottom:14px">논문 영어 단어 목록</div>
<table style="border-collapse:collapse;width:1320px"><tr style="height:46px"><td style="border:1.5px solid #444;padding:0 12px;width:360px;font-family:'Malgun Gothic'">영어 단어</td><td style="border:1.5px solid #444;width:360px;font-family:'Malgun Gothic'">한국어 단어</td><td style="border:1.5px solid #444;font-family:'Malgun Gothic'">한국어 의미</td></tr>${rows(W1,58)}</table>
<table style="border-collapse:collapse;width:780px;margin-top:60px">${rows(W2,46)}</table></div>
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.15),rgba(60,70,90,.0) 35%,rgba(60,70,90,0.22) 75%,rgba(40,45,60,0.32));pointer-events:none"></div>
<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 20% 85%,rgba(30,30,40,0.16),transparent 55%)"></div></body>`);
fs.writeFileSync(out,await m.screenshot({type:'jpeg',quality:80}));await b.close();})();
