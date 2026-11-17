// Registered evidence sources (subset of rag/sources.json used at query time).
// tests/rag-catalog.test.cjs checks that this stays identical to rag/sources.json.
export const RAG_CATALOG = {
  catalogVersion: 2,
  field: '전기공학',
  sources: [
    {
      id: 'kuphaldt-lec-dc',
      title: 'Lessons In Electric Circuits, Volume I - DC',
      author: 'Tony R. Kuphaldt',
      edition: 'Fifth Edition, last update November 06, 2021',
      url: 'https://www.ibiblio.org/kuphaldt/electricCircuits/DC/DC.pdf',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      checkedAt: '2026-11-17',
      restrictedPdfPages: []
    },
    {
      id: 'kuphaldt-lec-ac',
      title: 'Lessons In Electric Circuits, Volume II - AC',
      author: 'Tony R. Kuphaldt',
      edition: 'Sixth Edition, last update November 06, 2021',
      url: 'https://www.ibiblio.org/kuphaldt/electricCircuits/AC/AC.pdf',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      checkedAt: '2026-11-17',
      restrictedPdfPages: [429, 430]
    },
    {
      id: 'kuphaldt-lec-digital',
      title: 'Lessons In Electric Circuits, Volume IV - Digital',
      author: 'Tony R. Kuphaldt',
      edition: 'Fourth Edition, last update November 06, 2021',
      url: 'https://www.ibiblio.org/kuphaldt/electricCircuits/Digital/DIGI.pdf',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      checkedAt: '2026-11-18',
      restrictedPdfPages: [374, 383, 394, 405]
    },
    {
      id: 'ellingson-em-vol1',
      title: 'Electromagnetics, Volume 1',
      author: 'Steven W. Ellingson',
      edition: 'Volume 1, 2018',
      url: 'https://doi.org/10.21061/electromagnetics-vol-1',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      checkedAt: '2026-11-18',
      restrictedPdfPages: []
    },
    {
      id: 'ellingson-em-vol2',
      title: 'Electromagnetics, Volume 2',
      author: 'Steven W. Ellingson',
      edition: 'Volume 2, 2020',
      url: 'https://doi.org/10.21061/electromagnetics-vol-2',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      checkedAt: '2026-11-18',
      restrictedPdfPages: [47]
    },
    {
      id: 'bccampus-basic-motor-control',
      title: 'Basic Motor Control',
      author: 'Aaron Lee, Chad Flinn',
      edition: '2020 (Pressbooks 5.27.1 export)',
      url: 'https://opentextbc.ca/basicmotorcontrol/',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      checkedAt: '2026-11-18',
      restrictedPdfPages: []
    },
    {
      id: 'lehtonen-power-generation-ch8',
      title: 'Electrical Power Generation, Conversion and Transmission Systems (Chapter 8)',
      author: 'Matti Lehtonen, Edris Pouresmaeil, Mika Järvinen, Hanna Paulomäki',
      edition: '2025, pp. 655-686',
      url: 'https://doi.org/10.1007/978-3-031-69856-9_8',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      checkedAt: '2026-11-18',
      restrictedPdfPages: [4, 20, 21]
    },
    {
      id: 'mahr-inverter-based-power-systems',
      title: 'Control and Protection of 100% Inverter-based Power Systems',
      author: 'Florian Mahr',
      edition: '2025',
      url: 'https://doi.org/10.1007/978-3-658-47217-7',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      checkedAt: '2026-11-18',
      restrictedPdfPages: [205]
    },
    {
      id: 'kuphaldt-model-plc',
      title: 'Introduction to PLCs (Modular Electronics Learning project)',
      author: 'Tony R. Kuphaldt',
      edition: 'Last update 28 January 2026',
      url: 'https://ibiblio.org/kuphaldt/socratic/model/mod_plc.pdf',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      checkedAt: '2026-11-18',
      restrictedPdfPages: []
    },
    {
      id: 'chenwei810-semiconductor-manufacturing-intro',
      title: 'Introduction to Semiconductor Manufacturing (半導體製造概論), English edition',
      author: 'chenwei810 and contributors (GitHub)',
      edition: 'master @ 38e95fe7df84 (repository created 2026-10-11, last push 2026-10-30)',
      url: 'https://github.com/chenwei810/Semiconductor_Manufacturing_Introduction/tree/master/en',
      license: 'CC BY-NC-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
      checkedAt: '2026-11-18',
      restrictedPdfPages: []
    }
  ]
};
