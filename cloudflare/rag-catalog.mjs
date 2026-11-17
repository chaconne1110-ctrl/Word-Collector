// Registered evidence sources (subset of rag/sources.json used at query time).
// tests/rag-catalog.test.cjs checks that this stays identical to rag/sources.json.
export const RAG_CATALOG = {
  catalogVersion: 1,
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
    }
  ]
};
