// "근거 보기": evidence from the registered textbooks (server: cloudflare/rag.mjs).
// Used by the review screen and the flashcard back. Built with DOM nodes and
// textContent only (never HTML from data); only https links are shown.
(function (root) {
  'use strict';
  const STATUS = {
    found: ['자료 근거 있음', '#0b6b2f'],
    not_found: ['관련 근거를 찾지 못했어요', '#93000a'],
    search_failed: ['자료 검색 실패 · 자료 근거 미확인', '#93000a'],
    outdated_source: ['자료 근거 미확인 (최신 규정 아님)', '#6b4f00'],
    not_applicable: ['자료 근거 미확인', '#5f6368'],
    disabled: ['자료 근거 미확인', '#5f6368'],
    unavailable: ['자료 근거 미확인', '#5f6368']
  };
  const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
  const httpsUrl = value => typeof value === 'string' && /^https:\/\/[^\s"'<>]{1,500}$/.test(value) ? value : '';
  const pageLabel = quote => [quote.pdfPage ? 'PDF ' + quote.pdfPage + '쪽' : '',
    quote.printedPage ? '교재 인쇄 쪽수 ' + quote.printedPage + '쪽' : ''].filter(Boolean).join(' · ');

  // Keeps only the known fields (this is also what is saved with the word).
  function sanitize(evidence) {
    if (!evidence || typeof evidence !== 'object' || !STATUS[evidence.status]) {
      return {version: 1, status: 'unavailable', message: '이 분석에는 자료 검색 결과가 없어요. 자료 근거 미확인 상태입니다.',
        sources: [], notes: [], explanation: null, limitation: ''};
    }
    const sources = (Array.isArray(evidence.sources) ? evidence.sources : []).slice(0, 4).map(source => ({
      sourceId: text(source?.sourceId, 80), title: text(source?.title, 200), author: text(source?.author, 120),
      edition: text(source?.edition, 120), url: httpsUrl(source?.url), license: text(source?.license, 60),
      licenseUrl: httpsUrl(source?.licenseUrl), checkedAt: text(source?.checkedAt, 20),
      quotes: (Array.isArray(source?.quotes) ? source.quotes : []).filter(quote => quote?.verified === true)
        .slice(0, 3).map(quote => ({text: text(quote.text, 400), verified: true,
          pdfPage: Number.isInteger(quote.pdfPage) && quote.pdfPage > 0 ? quote.pdfPage : null,
          printedPage: text(quote.printedPage, 12) || null}))
    })).filter(source => source.title && source.url);
    const explanation = evidence.status === 'found' && evidence.explanation ?
      {ko: text(evidence.explanation.ko, 600), en: text(evidence.explanation.en, 600)} : null;
    return {version: 1, status: evidence.status, message: text(evidence.message, 200), limitation: text(evidence.limitation, 300),
      explanation, sources, notes: (Array.isArray(evidence.notes) ? evidence.notes : []).map(note => text(note, 300)).filter(Boolean).slice(0, 3),
      checkedAt: text(evidence.checkedAt, 30), cached: evidence.cached === true,
      latencyMs: Number.isFinite(evidence.latencyMs) ? Math.round(evidence.latencyMs) : undefined};
  }

  function el(tag, content, style) {
    const node = document.createElement(tag);
    if (content) node.textContent = content;
    if (style) node.style.cssText = style;
    return node;
  }
  function link(href, label) {
    const anchor = el('a', label, 'color:#00236f;text-decoration:underline;overflow-wrap:anywhere');
    anchor.href = href; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer';
    return anchor;
  }

  // A collapsible "근거 보기" block. The status is visible without opening it.
  function build(raw) {
    const evidence = sanitize(raw);
    const [label, color] = STATUS[evidence.status];
    const details = el('details', '', 'margin-top:10px;border:1px solid rgba(117,119,128,.3);border-radius:12px;padding:8px 12px;background:#fff;color:#131b2e;font-size:13px;line-height:1.5');
    details.className = 'wc-evidence';
    details.dataset.status = evidence.status;
    const summary = el('summary', '근거 보기 · ', 'cursor:pointer;font-weight:600');
    summary.append(el('span', label, 'color:' + color));
    details.append(summary);
    const body = el('div', '', 'display:flex;flex-direction:column;gap:8px;margin-top:8px');
    body.append(el('p', evidence.message));
    if (evidence.explanation) {
      const box = el('div', '', 'padding:8px;border-radius:8px;background:#eef4ff');
      box.append(el('p', '자료 근거 설명 (교재 내용을 AI가 요약)', 'font-weight:600'));
      if (evidence.explanation.ko) box.append(el('p', evidence.explanation.ko));
      if (evidence.explanation.en) box.append(el('p', evidence.explanation.en, 'color:#44474f'));
      body.append(box);
    }
    if (evidence.limitation) body.append(el('p', '한계: ' + evidence.limitation, 'color:#6b4f00'));
    for (const source of evidence.sources) {
      const card = el('div', '', 'border-top:1px solid rgba(117,119,128,.25);padding-top:8px;display:flex;flex-direction:column;gap:4px');
      card.append(el('p', source.title, 'font-weight:600;overflow-wrap:anywhere'));
      card.append(el('p', [source.author, source.edition].filter(Boolean).join(' · ')));
      for (const quote of source.quotes) {
        const block = el('blockquote', '“' + quote.text + '”', 'margin:0;padding-left:8px;border-left:3px solid #00236f;font-style:italic;overflow-wrap:anywhere');
        card.append(block);
        const where = pageLabel(quote);
        card.append(el('p', '원문 대조 완료' + (where ? ' · ' + where : ''), 'color:#44474f;font-size:12px'));
      }
      if (!source.quotes.length) card.append(el('p', '원문 구절은 원본 대조가 되지 않아 링크만 제공해요.', 'color:#44474f;font-size:12px'));
      const links = el('p', '', 'display:flex;flex-wrap:wrap;gap:10px');
      links.append(link(source.url, '원문 보기'));
      if (source.licenseUrl) links.append(link(source.licenseUrl, source.license || '라이선스'));
      card.append(links);
      if (source.checkedAt) card.append(el('p', '자료 확인일 ' + source.checkedAt + ' · 인용 구절은 원문 그대로, 설명은 AI 요약', 'color:#44474f;font-size:12px'));
      body.append(card);
    }
    for (const note of evidence.notes) body.append(el('p', note, 'color:#44474f;font-size:12px'));
    details.append(body);
    return details;
  }

  // Replaces any previous block inside container.
  function attach(container, evidence) {
    if (!container) return null;
    container.querySelectorAll(':scope > .wc-evidence').forEach(node => node.remove());
    const block = build(evidence);
    container.append(block);
    return block;
  }

  const api = {sanitize, build, attach, STATUS};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.WordCollectorEvidence = api;
})(typeof window !== 'undefined' ? window : globalThis);
