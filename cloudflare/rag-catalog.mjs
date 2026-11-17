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
    }
  ]
};
