/* Pure export functions: usable in a browser or through require(). */
(function (root) {
  'use strict';
  const headers = ['영어 단어', '한국어 뜻', '전문 분야', '과목', '영어 정의', '한국어 정의', '영어 예문', '예문 번역'];
  const aiHeaders = ['입력 단어', '영어 표제어', '한국어 뜻', '품사', '영어 정의', '한국어 정의', '영어 예문', '예문 번역'];
  const mime = {csv: 'text/csv;charset=utf-8', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
  function scalar(value) {
    if (value == null) return '';
    if (!['string', 'number', 'boolean'].includes(typeof value)) throw new Error('내보낼 항목은 문자열 또는 숫자여야 합니다.');
    return String(value);
  }
  function toRows(state, course = '', layout = 'basic') {
    if (!state || !state.terms || typeof state.terms !== 'object' || Array.isArray(state.terms) ||
        !state.courses || typeof state.courses !== 'object' || Array.isArray(state.courses)) {
      throw new Error('저장 데이터 구성을 확인해 주세요.');
    }
    if (!['basic', 'ai'].includes(layout)) throw new Error('내보내기 형식을 확인해 주세요.');
    const rows = [(layout === 'ai' ? aiHeaders : headers).slice()];
    for (const word of Object.values(state.terms)) {
      if (!word || typeof word !== 'object' || Array.isArray(word)) throw new Error('단어 데이터를 확인해 주세요.');
      if (course && word.course !== course) continue;
      const names = Object.hasOwn(state.courses, word.course) ? state.courses[word.course] : null;
      rows.push((layout === 'ai' ?
        [word.originalTerm, word.en, word.ko, word.pos, word.enDef, word.koDef, word.exampleEn, word.exampleKo] :
        [word.en, word.ko, word.discipline, Array.isArray(names) ? names[0] : word.course,
          word.enDef, word.koDef, word.exampleEn, word.exampleKo]).map(scalar));
    }
    return rows;
  }
  function csvCell(text) {
    if (/^[\s\u0000-\u001f]*[=+\-@]/u.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function toCsv(state, course = '', layout = 'basic') {
    const rows = toRows(state, course, layout);
    return {text: '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n', count: rows.length - 1};
  }
  function xml(text) {
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/u.test(text)) {
      throw new Error('Excel에서 지원하지 않는 제어 문자가 있습니다. 단어 내용을 확인해 주세요.');
    }
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/\r/g, '&#13;');
  }
  const encoder = new TextEncoder();
  function concat(parts) {
    const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
    let offset = 0;
    for (const part of parts) { result.set(part, offset); offset += part.length; }
    return result;
  }
  const crcTable = Uint32Array.from({length: 256}, (_, n) => {
    for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
    return n >>> 0;
  });
  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  // ZIP STORE keeps the writer dependency-free and available offline in WebView.
  function zip(files) {
    const local = [], central = [];
    let offset = 0;
    for (const [name, content] of files) {
      const filename = encoder.encode(name), bytes = encoder.encode(content), crc = crc32(bytes);
      if (offset + bytes.length + filename.length + 30 >= 0xffffffff) throw new Error('XLSX 파일 크기가 너무 큽니다.');
      const header = new Uint8Array(30), view = new DataView(header.buffer);
      view.setUint32(0, 0x04034b50, true); view.setUint16(4, 20, true); view.setUint16(6, 0x800, true);
      view.setUint16(12, 33, true); view.setUint32(14, crc, true);
      view.setUint32(18, bytes.length, true); view.setUint32(22, bytes.length, true); view.setUint16(26, filename.length, true);
      local.push(header, filename, bytes);
      const record = new Uint8Array(46), info = new DataView(record.buffer);
      info.setUint32(0, 0x02014b50, true); info.setUint16(4, 20, true); info.setUint16(6, 20, true);
      info.setUint16(8, 0x800, true); info.setUint16(14, 33, true); info.setUint32(16, crc, true);
      info.setUint32(20, bytes.length, true); info.setUint32(24, bytes.length, true);
      info.setUint16(28, filename.length, true); info.setUint32(42, offset, true);
      central.push(record, filename); offset += header.length + filename.length + bytes.length;
    }
    const directory = concat(central), end = new Uint8Array(22), info = new DataView(end.buffer);
    info.setUint32(0, 0x06054b50, true); info.setUint16(8, files.length, true); info.setUint16(10, files.length, true);
    info.setUint32(12, directory.length, true); info.setUint32(16, offset, true);
    return concat([...local, directory, end]);
  }
  function toXlsx(state, course = '', layout = 'basic') {
    const rows = toRows(state, course, layout);
    if (rows.length > 1048576) throw new Error('Excel 최대 행 수를 초과했습니다. 단어장을 나눠 내보내 주세요.');
    const sheetRows = rows.map((row, r) => '<row r="' + (r + 1) + '">' + row.map((value, c) => {
      if (value.length > 32767) throw new Error('Excel 한 셀의 최대 길이(32,767자)를 초과했습니다.');
      return '<c r="' + String.fromCharCode(65 + c) + (r + 1) + '" t="inlineStr" s="' + (r === 0 ? 1 : 0) + '"><is><t xml:space="preserve">' + xml(value) + '</t></is></c>';
    }).join('') + '</row>').join('');
    const head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    const relationships = 'http://schemas.openxmlformats.org/package/2006/relationships';
    const office = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
    const bytes = zip([
      ['[Content_Types].xml', head + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
      ['_rels/.rels', head + '<Relationships xmlns="' + relationships + '"><Relationship Id="rId1" Type="' + office + 'officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', head + '<workbook xmlns="' + ns + '" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="단어장" sheetId="1" r:id="rId1"/></sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', head + '<Relationships xmlns="' + relationships + '"><Relationship Id="rId1" Type="' + office + 'worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="' + office + 'styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml', head + '<styleSheet xmlns="' + ns + '"><fonts count="2"><font><sz val="11"/><name val="맑은 고딕"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="맑은 고딕"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF00236F"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'],
      ['xl/worksheets/sheet1.xml', head + '<worksheet xmlns="' + ns + '"><dimension ref="A1:H' + rows.length + '"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="4" width="22" customWidth="1"/><col min="5" max="8" width="50" customWidth="1"/></cols><sheetData>' + sheetRows + '</sheetData><autoFilter ref="A1:H' + rows.length + '"/></worksheet>']
    ]);
    return {bytes, count: rows.length - 1};
  }
  const api = {headers, aiHeaders, mime, toRows, toCsv, toXlsx};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WordCollectorExport = api;
})(globalThis);
