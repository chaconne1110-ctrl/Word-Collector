// Builds tests/fixtures/scan/paper.pdf: a 3-page English research paper with what real papers
// have — title, authors, affiliations, e-mail, abstract, keywords, two columns, hyphenated
// line breaks, citations, figure/table captions, units and symbols, running header, page
// numbers and a reference list (author names, journal abbreviations, DOIs). PAPER_TERMS is the
// answer key: the technical terms a student would want from this paper.
// Run: CHROMIUM_PATH=<chromium or msedge> node tests/fixtures/scan/make-paper.cjs
const fs = require('node:fs');
const path = require('node:path');

const PAPER_TERMS = [
  'graphene', 'photodetector', 'plasmonic', 'localized surface plasmon resonance', 'LSPR', 'responsivity',
  'photocurrent', 'dark current', 'gold nanoparticles', 'nanoparticle', 'Schottky barrier', 'hot electron',
  'hot electron injection', 'internal quantum efficiency', 'external quantum efficiency', 'EQE', 'IQE',
  'chemical vapor deposition', 'CVD', 'Raman spectroscopy', 'transmission electron microscopy', 'TEM',
  'electron beam lithography', 'specific detectivity', 'detectivity', 'noise equivalent power', 'NEP',
  'rise time', 'bandwidth', 'absorption', 'extinction spectrum', 'finite-difference time-domain', 'FDTD',
  'near-field enhancement', 'electric field', 'Fermi level', 'work function', 'carrier mobility', 'mobility',
  'substrate', 'electrode', 'bias voltage', 'photoconductive gain', 'heterostructure', 'wavelength',
  'monolayer', 'optoelectronic', 'interband transition', 'shot noise', 'flicker noise'
];

const P = {
  abstract: `Graphene photodetectors combine broadband absorption with ultrafast response, but the weak optical absorption of a single monolayer limits their responsivity. Here we report a plasmonic graphene photodetector in which gold nanoparticles support localized surface plasmon resonance (LSPR) at visible wavelengths. The near-field enhancement around each nanoparticle increases the absorption in the graphene channel, and hot electron injection across the Schottky barrier at the gold/graphene interface adds a second photocurrent pathway. The device shows a responsivity of 4.2 A/W at 532 nm, a specific detectivity of 3.1 × 10<sup>11</sup> Jones and a rise time of 18 μs, while the dark current remains below 40 nA at a bias voltage of 0.5 V.`,
  keywords: 'graphene; photodetector; localized surface plasmon resonance; hot electron injection; responsivity',
  intro1: `Two-dimensional materials have attracted intense interest for optoelectronic devices because their electronic properties can be tuned by gating, strain and chemical doping [1–3]. Graphene, in particular, offers high carrier mobility and a gapless band structure that allows interband transitions over a very wide spectral range [4]. However, a monolayer absorbs only about 2.3% of normally incident light, so the responsivity of simple graphene photodetectors is typically below 10 mA/W [5].`,
  intro2: `Several strategies have been proposed to overcome this limitation, including waveguide integration, microcavities and hybrid heterostructures with quantum dots [6, 7]. Plasmonic nanostructures are especially attractive because the localized surface plasmon resonance of metal nanoparticles concentrates the electric field into volumes far below the diffraction limit [8]. In addition, plasmon decay generates hot electrons that can be emitted over a Schottky barrier, a process known as internal photoemission [9, 10].`,
  methods1: `Monolayer graphene was grown on copper foil by chemical vapor deposition (CVD) and transferred onto a Si/SiO<sub>2</sub> substrate using a polymer-assisted wet transfer. Raman spectroscopy confirmed the monolayer character through the ratio of the 2D and G peaks. Source and drain electrodes (Ti/Au, 5/50 nm) were defined by electron beam lithography and metal evaporation.`,
  methods2: `Gold nanoparticles with a mean diameter of 60 nm were deposited by spin coating from a colloidal solution. Transmission electron microscopy (TEM) showed a narrow size distribution, and the extinction spectrum displayed a resonance peak at 535 nm. The optical response was simulated with the finite-difference time-domain (FDTD) method, which predicts a near-field enhancement factor of about 40 at the particle edge.`,
  results1: `The photocurrent was measured under 532 nm laser illumination while the bias voltage was varied from −1 V to 1 V. Compared with a bare graphene device, the plasmonic device shows an eightfold increase in responsivity. The external quantum efficiency (EQE) reaches 9.8%, and after correcting for the measured absorption the internal quantum efficiency (IQE) is estimated at 47%.`,
  results2: `The noise spectrum is dominated by flicker noise below 1 kHz and by shot noise at higher frequencies. From the noise current we obtain a noise equivalent power (NEP) of 2.4 pW/Hz<sup>1/2</sup>. The specific detectivity, which normalizes the NEP by the device area and bandwidth, is 3.1 × 10<sup>11</sup> Jones. The rise time of 18 μs is limited by the measurement circuit rather than by carrier transport.`,
  discussion: `The enhancement can be explained by two mechanisms. First, the near-field enhancement raises the absorption in graphene near each particle. Second, hot electrons generated in the gold cross the Schottky barrier, whose height depends on the work function of gold and the Fermi level of graphene. Because the gate voltage shifts the Fermi level, the photoconductive gain and the barrier height can be tuned electrically, which offers a simple route to optimize detectivity for a given wavelength.`,
  conclusion: `We demonstrated a plasmonic graphene photodetector that combines near-field enhancement and hot electron injection. The approach is compatible with wafer-scale processing and can be extended to other two-dimensional materials and plasmonic geometries.`
};
const REFERENCES = [
  'F. Xia, T. Mueller, Y. Lin, A. Valdes-Garcia, P. Avouris, Ultrafast graphene photodetector, Nat. Nanotechnol. 4 (2009) 839–843. doi:10.1038/nnano.2009.292',
  'F. H. L. Koppens, T. Mueller, Ph. Avouris, A. C. Ferrari, M. S. Vitiello, M. Polini, Photodetectors based on graphene, other two-dimensional materials and hybrid systems, Nat. Nanotechnol. 9 (2014) 780–793.',
  'T. J. Echtermeyer, L. Britnell, P. K. Jasnos, A. Lombardo, R. V. Gorbachev et al., Strong plasmonic enhancement of photovoltage in graphene, Nat. Commun. 2 (2011) 458.',
  'K. S. Novoselov, A. K. Geim, S. V. Morozov, D. Jiang, Electric field effect in atomically thin carbon films, Science 306 (2004) 666–669.',
  'R. R. Nair, P. Blake, A. N. Grigorenko, K. S. Novoselov, T. J. Booth, Fine structure constant defines visual transparency of graphene, Science 320 (2008) 1308.',
  'G. Konstantatos, M. Badioli, L. Gaudreau, J. Osmond, M. Bernechea, Hybrid graphene–quantum dot phototransistors with ultrahigh gain, Nat. Nanotechnol. 7 (2012) 363–368.',
  'M. W. Knight, H. Sobhani, P. Nordlander, N. J. Halas, Photodetection with active optical antennas, Science 332 (2011) 702–704.',
  'C. Clavero, Plasmon-induced hot-electron generation at nanoparticle/metal-oxide interfaces, Nat. Photonics 8 (2014) 95–103.',
  'M. L. Brongersma, N. J. Halas, P. Nordlander, Plasmon-induced hot carrier science and technology, Nat. Nanotechnol. 10 (2015) 25–34.',
  'Z. Fang, Z. Liu, Y. Wang, P. M. Ajayan, P. Nordlander, N. J. Halas, Graphene-antenna sandwich photodetector, Nano Lett. 12 (2012) 3808–3813.'
];

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
@page { size: A4; margin: 18mm 16mm 20mm; @top-center { content: "Journal of Applied Optoelectronics 12 (2026) 101–110"; } }
body { font: 9.6pt/1.38 Georgia, 'Times New Roman', serif; color: #111; hyphens: auto; -webkit-hyphens: auto; }
header { text-align: center; margin-bottom: 10pt; }
h1 { font: bold 16pt/1.25 Georgia, serif; margin: 0 0 6pt; }
.authors { font-size: 10pt; } .aff { font-size: 8pt; color: #444; margin-top: 3pt; }
.abstract { border-top: 1px solid #999; border-bottom: 1px solid #999; padding: 6pt 0; margin: 8pt 0; text-align: justify; }
.cols { column-count: 2; column-gap: 7mm; text-align: justify; }
h2 { font: bold 10pt Georgia, serif; margin: 8pt 0 3pt; }
p { margin: 0 0 5pt; text-indent: 1.2em; }
figure { break-inside: avoid; margin: 6pt 0; } .fig { height: 70pt; border: 1px solid #aaa; background: linear-gradient(90deg,#eef,#fff); }
figcaption, .tcap { font-size: 8pt; }
table { font-size: 8pt; border-collapse: collapse; width: 100%; } td, th { border-bottom: 1px solid #ccc; padding: 1pt 2pt; text-align: left; }
.refs { font-size: 7.8pt; } .refs li { margin-bottom: 2pt; }
.running { position: fixed; top: -12mm; left: 0; right: 0; text-align: center; font-size: 7.5pt; color: #666; }
.pageno { position: fixed; bottom: -12mm; left: 0; right: 0; text-align: center; font-size: 8pt; }
</style></head><body>
<div class="running">J.-H. Park et al. / Journal of Applied Optoelectronics 12 (2026) 101–110</div>
<header><h1>Plasmonic Enhancement of Graphene Photodetectors by Gold Nanoparticles</h1>
<div class="authors">Ji-Hoon Park<sup>a</sup>, Seo-Yeon Kim<sup>a</sup>, Daniel R. Whitmore<sup>b,*</sup></div>
<div class="aff"><sup>a</sup> Department of Electrical Engineering, Hanbit University, Seoul, Korea · <sup>b</sup> Institute for Photonic Materials, Lakeside, USA<br>* Corresponding author. E-mail: d.whitmore@example.edu</div></header>
<div class="abstract"><b>Abstract.</b> ${P.abstract}<br><b>Keywords:</b> ${P.keywords}</div>
<div class="cols">
<h2>1. Introduction</h2><p>${P.intro1}</p><p>${P.intro2}</p>
<h2>2. Methods</h2><p>${P.methods1}</p><p>${P.methods2}</p>
<figure><div class="fig"></div><figcaption><b>Fig. 1.</b> (a) Schematic of the plasmonic graphene photodetector. (b) Extinction spectrum of the gold nanoparticles and FDTD map of the near-field enhancement.</figcaption></figure>
<h2>3. Results</h2><p>${P.results1}</p><p>${P.results2}</p>
<p class="tcap"><b>Table 1.</b> Figures of merit of the bare and plasmonic devices.</p>
<table><tr><th>Device</th><th>R (A/W)</th><th>D* (Jones)</th><th>τ<sub>r</sub> (μs)</th></tr><tr><td>Bare graphene</td><td>0.52</td><td>4.0 × 10<sup>10</sup></td><td>15</td></tr><tr><td>Plasmonic</td><td>4.2</td><td>3.1 × 10<sup>11</sup></td><td>18</td></tr></table>
<h2>4. Discussion</h2><p>${P.discussion}</p>
<h2>5. Conclusion</h2><p>${P.conclusion}</p>
<h2>Acknowledgments</h2><p>This work was supported by the National Research Foundation of Korea (grant 2026R1A2C1012345).</p>
<h2>References</h2><ol class="refs">${REFERENCES.map(ref => `<li>${ref}</li>`).join('')}</ol>
</div></body></html>`;

module.exports = {PAPER_TERMS};
if (require.main === module) (async () => {
  const {chromium} = require('playwright');
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
  try {
    const page = await browser.newPage();
    await page.setContent(html);
    const out = path.join(__dirname, 'paper.pdf');
    await page.pdf({path: out, format: 'A4', printBackground: true, margin: {top: '18mm', bottom: '20mm', left: '16mm', right: '16mm'},
      displayHeaderFooter: true, headerTemplate: '<div style="font-size:7px;width:100%;text-align:center;color:#666">Journal of Applied Optoelectronics 12 (2026) 101–110</div>',
      footerTemplate: '<div style="font-size:8px;width:100%;text-align:center"><span class="pageNumber"></span></div>'});
    console.log('paper.pdf', fs.statSync(out).size, 'bytes');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
