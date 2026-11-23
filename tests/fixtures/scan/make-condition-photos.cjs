// Builds two phone-like photos of the same English textbook page for scan-words-browser.cjs:
//   blurry-photo.jpg – out of focus (blur 2.6 px): read only after sharpening
//   tilted-photo.jpg – page turned 12°: read only after the tilt is straightened
// Before those fixes both gave 0 of 50 words. Run:
//   CHROMIUM_PATH=<chromium or msedge> node tests/fixtures/scan/make-condition-photos.cjs
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');

const PARAS = [
  'Semiconductor devices control the flow of electric current through a crystal lattice.',
  'When a forward bias voltage is applied to a diode, electrons cross the junction and the current rises quickly.',
  'In a photodiode, incoming light generates electron and hole pairs, which produce a photocurrent proportional to the illumination.',
  'Engineers reduce the dark current by cooling the detector and by using a wider bandgap material.',
  'The capacitance of the depletion region decreases as the reverse bias increases.',
  'Thermal noise and shot noise limit the sensitivity of every optical receiver.'
];
const page = skew => '<!doctype html><body style="margin:0;background:#4a4f57;width:1500px;height:2000px;overflow:hidden">' +
  '<div style="position:absolute;left:5%;top:4%;width:90%;height:92%;background:#fbfaf6;box-shadow:0 10px 40px #000;' +
  `transform:rotate(${skew}deg);padding:6% 7%;box-sizing:border-box;font:30px/1.6 Georgia,serif;color:#1d1d1f">` +
  '<h2 style="font:bold 39px Arial;margin:0 0 .6em">3.4 Photodetectors</h2>' +
  PARAS.map(text => `<p style="margin:0 0 .8em;text-align:justify">${text}</p>`).join('') + '</div></body>';

(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
  try {
    const tab = await browser.newPage({viewport: {width: 1500, height: 2000}});
    for (const [name, skew, blur] of [['blurry-photo.jpg', 0, 2.6], ['tilted-photo.jpg', -12, 0]]) {
      await tab.setContent(page(skew));
      const png = (await tab.screenshot({type: 'png'})).toString('base64');
      const jpeg = await tab.evaluate(async ({png, blur}) => {
        const image = new Image();
        image.src = 'data:image/png;base64,' + png;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        context.filter = blur ? `blur(${blur}px)` : 'none';
        context.drawImage(image, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.88).split(',')[1];
      }, {png, blur});
      fs.writeFileSync(path.join(__dirname, name), Buffer.from(jpeg, 'base64'));
      console.log(name, fs.statSync(path.join(__dirname, name)).size, 'bytes');
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
