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
      restrictedPdfPages: [429,  430]
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
      restrictedPdfPages: [374,  383,  394,  405]
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
      id: 'kuphaldt-model-dc2dc',
      title: 'DC-DC Power Conversion (Modular Electronics Learning project)',
      author: 'Tony R. Kuphaldt',
      edition: 'Last update 4 November 2026',
      url: 'https://www.ibiblio.org/kuphaldt/socratic/model/mod_dc2dc.pdf',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      checkedAt: '2026-11-18',
      restrictedPdfPages: []
    },
    {
      id: 'kuphaldt-model-prot-relay',
      title: 'Principles of Protective Relaying (Modular Electronics Learning project)',
      author: 'Tony R. Kuphaldt',
      edition: 'Last update 3 December 2024',
      url: 'https://www.ibiblio.org/kuphaldt/socratic/model/mod_prot_relay.pdf',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      checkedAt: '2026-11-18',
      restrictedPdfPages: []
    },
    {
      id: 'kuphaldt-model-breaker',
      title: 'Circuit Breakers and Disconnects (Modular Electronics Learning project)',
      author: 'Tony R. Kuphaldt',
      edition: 'Last update 9 March 2025',
      url: 'https://www.ibiblio.org/kuphaldt/socratic/model/mod_breaker.pdf',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      checkedAt: '2026-11-18',
      restrictedPdfPages: []
    },
    {
      id: 'jarvinen-renewable-energy-systems',
      title: 'Designing Renewable Energy Systems within Planetary Boundaries',
      author: 'Mika Järvinen, Hanna Paulomäki (eds.)',
      edition: '2025, corrected publication 2025',
      url: 'https://doi.org/10.1007/978-3-031-69856-9',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      checkedAt: '2026-11-18',
      restrictedPdfPages: [18,  20,  21,  22,  24,  37,  60,  76,  80,  85,  158,  160,  203,  214,  223,  259,  303,  307,  308,  316,  319,  325,  330,  361,  426,  428,  430,  434,  452,  454,  480,  491,  520,  526,  593,  597,  628,  634,  638,  657,  668,  684,  685,  686,  708,  715]
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
    },
    {
      id: 'gerlach-thermal-oxidation-2016',
      title: 'A Self-Consistent Model for Thermal Oxidation of Silicon at Low Oxide Thickness',
      author: 'Gerald Gerlach, Karl Maser',
      edition: '2016',
      url: 'https://doi.org/10.1155/2016/7545632',
      license: 'CC BY (Creative Commons Attribution License; version not stated in the article)',
      licenseUrl: 'https://creativecommons.org/licenses/',
      checkedAt: '2026-11-18',
      restrictedPdfPages: [6]
    },
    {
      id: 'basu-lithography-review-2025',
      title: 'Advancements in Lithography Techniques and Emerging Molecular Strategies for Nanostructure Fabrication',
      author: 'Prithvi Basu, Jyoti Verma, Vishnuram Abhinav, Ratneshwar Kumar Ratnesh, Yogesh Kumar Singla, Vibhor Kumar',
      edition: '2025',
      url: 'https://doi.org/10.3390/ijms26073027',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      checkedAt: '2026-11-18',
      restrictedPdfPages: [4,  7,  9,  10,  11,  12,  14,  16,  18,  20,  22,  23,  24,  29,  31,  32,  36,  41,  43,  44,  46]
    },
    {
      id: 'huff-rie-review-2021',
      title: 'Recent Advances in Reactive Ion Etching and Applications of High-Aspect-Ratio Microfabrication',
      author: 'Michael Huff',
      edition: '2021',
      url: 'https://doi.org/10.3390/mi12080991',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      checkedAt: '2026-11-18',
      restrictedPdfPages: [18]
    },
    {
      id: 'arun-thin-films-review-2025',
      title: 'Thin Films for Next Generation Technologies: A Comprehensive Review of Fundamentals, Growth, Deposition Strategies, Applications, and Emerging Frontiers',
      author: 'Ajith P. Arun, Niranjana Sreenivasan, Jagadish H. Patil, Raviraj Kusanur, Hemanth L. Ramachandraiah, Mahesh Ramakrishna',
      edition: '2025',
      url: 'https://doi.org/10.3390/pr13123846',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      checkedAt: '2026-11-18',
      restrictedPdfPages: []
    },
    {
      id: 'barron-main-group-chemistry',
      title: 'Chemistry of the Main Group Elements (Barron)',
      author: 'Andrew R. Barron (Rice University)',
      edition: 'LibreTexts PDF export (v=f54e83abf296df8558e5851146017616-5)',
      url: 'https://chem.libretexts.org/Bookshelves/Inorganic_Chemistry/Chemistry_of_the_Main_Group_Elements_(Barron)',
      license: 'CC BY 3.0 (most pages) / CC BY 1.0 (14 pages)',
      licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
      checkedAt: '2026-11-18',
      restrictedPdfPages: [135,  146,  149,  150,  151,  152,  153,  154,  203,  277,  291,  295,  305,  339,  340,  365,  366,  370,  402,  403]
    },
    {
      id: 'nogami-interconnects-2023',
      title: 'Interconnect technologies and materials for logic at 2 nm and beyond',
      author: 'Takeshi Nogami',
      edition: '2023',
      url: 'https://doi.org/10.11470/jsaprev.230210',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      checkedAt: '2026-11-18',
      restrictedPdfPages: []
    },
    {
      id: 'tudelft-vlsi-test-module2',
      title: 'VLSI Test Technology and Reliability (ET4076), Lecture 2: VLSI Test Process and Test Equipment',
      author: 'Said Hamdioui (TU Delft Computer Engineering Lab)',
      edition: 'Lecture slides 2009-2010 (course page published 2016-02-10, edited 2023-02-28)',
      url: 'https://ocw.tudelft.nl/courses/vlsi-test-technology-reliabillity/',
      license: 'CC BY-NC-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
      checkedAt: '2026-11-18',
      restrictedPdfPages: [25]
    }
  ]
};
