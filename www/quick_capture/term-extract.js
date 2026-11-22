// PDF·사진에서 단어 찾기: finds word candidates in English text read from a PDF or a
// photo (OCR). Runs in the browser (scan.js) and in Node unit tests.
//   - mode 'all' (모든 단어, the default): every English word except grammar words
//   - mode 'major' (전공용어 위주): common everyday English is left out as well
//   - 2–3 word terms ("skin effect", "power factor correction") that appear at least twice
//   - joins words broken by a hyphen at a line end ("induc-\ntance" → "inductance")
//   - plural/singular forms are merged; each candidate keeps its count and the first
//     sentence it appears in
// Nothing here is stored: the caller keeps only the words the user picks and their sentences.
(function(root) {
  'use strict';

  // Grammar words (articles, pronouns, prepositions, auxiliaries…): never a candidate.
  const FUNCTION_WORDS = new Set(`a an the and or nor but if then else than so as at by for from in into of on onto
    off out over under to up down with within without about above below across after before behind between
    beyond during except inside near outside past since through throughout toward towards until upon via per
    versus vs i me my mine we us our ours you your yours he him his she her hers it its they them their theirs
    this that these those who whom whose which what where when why how whether while although though because
    unless whereas is am are was were be been being do does did done doing have has had having can could may
    might must shall should will would not no yes also too very just only even still yet already all any both
    each either neither every few many much more most less least some such same other another own here there
    thus hence therefore however moreover furthermore indeed etc ie eg fig figs eq eqs ref refs et al`
    .split(/\s+/).filter(Boolean));

  // Everyday words left out as single-word candidates (they still count inside phrases).
  const COMMON_WORDS = new Set(`able about above accept access according account achieve act action active actual
    actually add added addition additional address age ago agree air allow allowed almost alone along always among
    amount analysis animal answer anyone anything appear apply approach area areas argue arm around arrive art article
    ask asked assume attention available average avoid away back bad bag ball bank base based basic basis bear beat
    beautiful become becomes began begin beginning behavior believe benefit best better big bill bit black blood blue
    board body book born box boy break bring brother brought build building built business buy call called came
    car card care career carry case cases cause caused center central century certain certainly chair challenge
    chance change changed changes chapter character charge check child children choice choose church citizen city
    class clear clearly close coach cold collection college color come comes common community company compare
    complete completely computer concern condition conditions conference consider considered consumer contain
    contains continue control cost costs could country couple course court cover create created cultural culture
    cup customer cut dark data date daughter day days dead deal death debate decade decide decision deep defense
    degree depend describe described design detail details determine develop developed development die difference
    different difficult dinner direction director discover discuss discussion disease doctor dog door draw dream
    drive drop drug due during early east easy eat economic economy edge education effort eight either election
    else employee end energy enjoy enough enter entire environment especially establish evening event events ever
    everybody everyone everything evidence exactly example examples executive exist expect experience expert
    explain eye eyes face fact factor fail fall family far fast father fear federal feel feeling field fight figure
    fill film final finally financial find fine finger finish fire firm first fish five floor fly focus follow
    following food foot force foreign forget form former forward found four free friend front full fund future
    game garden gas general generally generation get gets girl give given gives glass go goal goes going gone good
    got government great green ground group grow growth guess gun guy hair half hand hang happen happy hard head
    health hear heard heart heat heavy help high higher himself history hit hold home hope hospital hot hotel hour
    hours house huge human hundred husband idea ideas identify image imagine impact important improve include
    included includes including increase increased indicate individual industry information instead institution
    interest interesting international interview introduce introduction issue issues item itself job join keep
    key kid kill kind kitchen know knowledge known land language large largely last late later laugh law lawyer lay
    lead leader learn leave left leg legal let letter level lie life light like likely line lines list listen
    little live local long longer look looking lose lot love low lower machine made magazine main maintain
    major majority make makes making man manage management manager many market marriage material matter maybe
    mean means measure media medical meet meeting member memory mention message method methods middle might
    military million mind minute miss mission model modern moment money month months morning mother mouth move
    movement movie mrs much music myself name nation national natural nature near nearly necessary need needed
    needs network never new news newspaper next nice night none normal north note nothing notice now number
    numbers occur offer office officer official often oh oil ok old once one ones open operation opportunity option
    order organization original others otherwise outcome owner page pain painting paper parent part particular
    particularly partner parts party pass pattern pay peace people perform performance perhaps period person
    personal phone physical pick picture piece place plan plant play player point points police policy political
    politics poor popular population position positive possible power practice prepare present president pressure
    pretty prevent price private probably problem problems process produce produced product production
    professional professor program project property protect prove provide provided provides public pull purpose
    push put quality question questions quickly quite race radio raise range rate rather reach read ready real
    reality realize really reason receive recent recently recognize record red reduce reflect region relate
    relationship religious remain remember remove report represent republican require required requires research
    resource respond response responsibility rest result results return reveal rich right rise risk road rock role
    room rule run safe said save say says scene school science scientist score sea season seat second section
    security see seek seem seems seen sell send senior sense series serious serve service set seven several shake
    share shoot short shot show shown shows side sign significant similar simple simply since sing single sister
    sit site situation six size skill skin small smile social society soldier somebody someone something sometimes
    son song soon sort sound source south southern space speak special specific speech spend sport spring staff
    stage stand standard star start state statement states station stay step stock stop store story strategy
    street strong structure student study stuff style subject success successful suddenly suffer suggest summer
    support sure surface system systems table take taken takes talk task tax teach teacher team technology
    television tell ten tend term terms test text thank thing things think third thought thousand threat three
    time times today together tonight top total tough town trade traditional training travel treat treatment tree
    trial trip trouble true truth try turn tv two type types understand unit until use used useful user uses using
    usually value values various view violence visit voice vote wait walk wall want war watch water way ways weapon
    wear week weight well west western whatever white whole wide wife win wind window wish woman women wonder word
    words work worker working works world worry write writer writing wrong yard yeah year years young yourself
    zero one two three four five six seven eight nine ten first second third shown table chapter section page
    figure equation example problem solution answer question exercise note cause improve reduce effective
    large plant detail decrease obtain occur consist define describe usually typical typically great small
    consider assume certain important given apply known again later once twice next equal maximum minimum`.split(/\s+/).filter(Boolean));

  // A word, keeping hyphenated compounds ("cross-sectional") whole.
  const WORD = /[A-Za-z]+(?:[-‐‑'’][A-Za-z]+)*/g;

  // Inflected forms of everyday words ("causes", "reduced", "largest") are everyday too.
  function baseForms(word) {
    const forms = [word];
    const strip = (suffix, add = '') => {
      if (word.length > suffix.length + 2 && word.endsWith(suffix)) forms.push(word.slice(0, -suffix.length) + add);
    };
    strip('s'); strip('es'); strip('ies', 'y'); strip('ed'); strip('d'); strip('ied', 'y'); strip('ing'); strip('ing', 'e');
    strip('er'); strip('r'); strip('est'); strip('st'); strip('ly'); strip('ally');
    for (const form of [...forms]) if (/([b-df-hj-np-tv-z])\1$/.test(form)) forms.push(form.slice(0, -1));
    return forms;
  }
  // The ~3,900 most common English words (SCOWL size 10, common-words.js) are everyday too:
  // "background", "engineer", "measured"…
  const SCOWL_COMMON = new Set(typeof module !== 'undefined' && module.exports ?
    require('./common-words.js') : root.WordCollectorCommonWords || []);
  // Everyday words that are also basic terms in electrical engineering and semiconductors:
  // kept in 전공용어 위주 (with their inflected forms: "currents", "charged"…).
  const MAJOR_KEEP = new Set(`current power voltage charge field circuit energy frequency phase load ground
    source drain gate bias junction signal resistance resistor conductor insulator capacitance inductance
    impedance wave cell battery magnet magnetic electric electrical electronic electron motor generator switch
    transistor diode noise gain feedback filter bridge terminal potential capacity density flux induction
    conduction emission absorption reflection band carrier layer film contact metal oxide crystal silicon
    semiconductor substrate electrode wafer photon spectrum laser lens beam heat temperature pressure force
    mass speed velocity acceleration torque rotor stator winding coil core transformer transmission
    distribution grid network supply output input amplifier oscillator sensor detector light optical
    loss efficiency`
    .split(/\s+/).filter(Boolean));
  const isEveryday = lower => lower.split(/[-‐‑]/).every(part => {
    const forms = baseForms(part);
    if (forms.some(form => MAJOR_KEEP.has(form))) return false;
    return forms.some(form => FUNCTION_WORDS.has(form) || COMMON_WORDS.has(form) || SCOWL_COMMON.has(form));
  });
  const MAX_SENTENCE = 600;

  // Text from a PDF text layer or OCR → clean sentences.
  function normalizeText(text) {
    return String(text ?? '').normalize('NFKC')
      .replace(/­/g, '')                                  // soft hyphens
      .replace(/\r\n?/g, '\n')
      .replace(/https?:\/\/\S+|www\.\S+|\S+@\S+\.\S+/g, ' ')   // links and e-mail addresses
      .replace(/([A-Za-z])[-‐‑]\s*\n\s*([a-z])/g, '$1$2')      // "induc-\ntance" → "inductance"
      .replace(/[ \t\f\v]+/g, ' ');
  }

  function splitSentences(text) {
    return normalizeText(text)
      .split(/\n\s*\n/)                                        // blank line = paragraph end
      .map(block => block.replace(/\s*\n\s*/g, ' ').trim())
      .flatMap(block => block.split(/(?<=[.!?])\s+(?=["'(\[]?[A-Z0-9])/))
      .map(sentence => sentence.trim())
      .filter(sentence => /[A-Za-z]{2}/.test(sentence));
  }

  const isAcronym = word => /^[A-Z]{2,6}s?$/.test(word);
  const hasVowel = word => /[aeiouy]/i.test(word);

  // The sentence, cut to 600 characters around the term when it is longer.
  function sentenceAround(sentence, term) {
    if (sentence.length <= MAX_SENTENCE) return sentence;
    const at = Math.max(0, sentence.toLowerCase().indexOf(term.toLowerCase()));
    const start = Math.max(0, Math.min(at - 200, sentence.length - MAX_SENTENCE));
    return sentence.slice(start, start + MAX_SENTENCE).trim();
  }

  function singularKey(key, keys) {
    const forms = [];
    if (/ies$/.test(key)) forms.push(key.slice(0, -3) + 'y');
    if (/(?:s|x|z|ch|sh)es$/.test(key)) forms.push(key.slice(0, -2));
    if (/[^s]s$/.test(key)) forms.push(key.slice(0, -1));
    return forms.find(form => keys.has(form)) || key;
  }

  // Which words can be candidates. Both modes leave out grammar words, contractions
  // ("don't"), words shorter than 3 letters and letter runs without a vowel (OCR noise);
  // acronyms ("RLC", "MOSFETs") are kept. 'major' also leaves out everyday English.
  function isCandidate(surface, lower, mode) {
    if (isAcronym(surface)) return !FUNCTION_WORDS.has(lower);
    if (lower.length < 3 || !hasVowel(lower) || /['’]/.test(lower)) return false;
    if (lower.split(/[-‐‑]/).every(part => FUNCTION_WORDS.has(part))) return false;
    return mode === 'major' ? !isEveryday(lower) : true;
  }

  // Multi-word terms ("skin effect", "power factor correction"): 2–3 words in a row that
  // appear at least MIN_PHRASE_COUNT times. A phrase never contains grammar words and
  // never spans punctuation, digits or a "…" left by an unreadable word.
  const MIN_PHRASE_COUNT = 2;

  function extractCandidates(text, {mode = 'all'} = {}) {
    const found = new Map();   // key → {forms, count, sentence, size, lowerSeen, midCapital}
    const add = (key, surface, sentence, size, first) => {
      let entry = found.get(key);
      if (!entry) found.set(key, entry = {key, forms: new Map(), count: 0, sentence, size, lowerSeen: false, midCapital: false});
      entry.count++;
      if (/^[a-z]/.test(surface)) entry.lowerSeen = true;
      else if (!first) entry.midCapital = true;
      entry.forms.set(surface, (entry.forms.get(surface) || 0) + 1);
    };
    for (const sentence of splitSentences(text)) {
      const tokens = [...sentence.matchAll(WORD)].map(match => {
        const surface = match[0].replace(/['’]s$/i, '');
        return {surface, lower: surface.toLowerCase(), index: match.index, end: match.index + match[0].length};
      });
      const joined = (a, b) => /^[\s-]*$/.test(sentence.slice(a.end, b.index));
      // A capital that does not mark a name: sentence start, right after "(", or a Title
      // Case run such as "(Power Conversion)" in Korean documents. Only other capitals
      // (e.g. "cite Faraday here") keep a word capitalised.
      const capitalOnly = token => /^[A-Z]/.test(token?.surface || '');
      const notName = i => i === 0 || /\(\s*$/.test(sentence.slice(Math.max(0, tokens[i].index - 3), tokens[i].index)) ||
        (capitalOnly(tokens[i - 1]) && joined(tokens[i - 1], tokens[i])) || (capitalOnly(tokens[i + 1]) && joined(tokens[i], tokens[i + 1]));
      tokens.forEach(({surface, lower}, i) => {
        if (isCandidate(surface, lower, mode)) add(isAcronym(surface) ? surface.replace(/s$/, '') : lower, surface, sentence, 1, notName(i));
        for (let size = 2; size <= 3; size++) {
          const words = tokens.slice(i, i + size);
          if (words.length < size) break;
          if (words.some(word => FUNCTION_WORDS.has(word.lower) || word.lower.length < 2 || /['’]/.test(word.lower))) break;
          if (words.slice(1).some((word, k) => !joined(words[k], word))) break;
          // Kept in both modes: a repeated phrase of everyday words can still be a term
          // ("power factor", "dark current").
          add(words.map(word => word.lower).join(' '), words.map(word => word.surface).join(' '), sentence, size, i === 0);
        }
      });
    }
    // Merge plural forms into the singular form when both appear.
    const keys = new Set(found.keys());
    for (const [key, entry] of [...found]) {
      const target = singularKey(key, keys);
      if (target === key) continue;
      const base = found.get(target);
      base.count += entry.count;
      base.lowerSeen ||= entry.lowerSeen;
      base.midCapital ||= entry.midCapital;
      for (const [form, n] of entry.forms) base.forms.set(form, (base.forms.get(form) || 0) + n);
      found.delete(key);
    }
    let entries = [...found.values()].filter(entry => entry.size === 1 || entry.count >= MIN_PHRASE_COUNT);
    // "power factor" inside "power factor correction" with the same count is the same use.
    const phrases = entries.filter(entry => entry.size > 1);
    entries = entries.filter(entry => entry.size === 1 || !phrases.some(other =>
      other.size > entry.size && other.count === entry.count && (' ' + other.key + ' ').includes(' ' + entry.key + ' ')));
    return entries.map(entry => {
      // Keep capitals only for acronyms, or names written with a capital every time
      // (also in the middle of a sentence, e.g. "Faraday").
      const forms = [...entry.forms.keys()];
      const name = entry.size === 1 && !entry.lowerSeen && entry.midCapital;
      const term = entry.size === 1 && isAcronym(forms[0]) ? entry.key :
        name ? entry.key[0].toUpperCase() + entry.key.slice(1) : entry.key;
      return {term, count: entry.count, kind: entry.size > 1 ? 'phrase' : 'word', sentence: sentenceAround(entry.sentence, forms[0])};
    }).sort((a, b) => b.count - a.count || (a.kind === b.kind ? 0 : a.kind === 'phrase' ? -1 : 1) ||
      a.term.localeCompare(b.term));
  }

  // ---- Repairing words cut by the character recognition (OCR text only) ----------------
  // OCR sometimes drops the first or last letters of a word ("apacitance", "emical",
  // "oltage", "electr") or reads a stray short piece ("ent", "ina"). With an English
  // dictionary (english-words.js, ~120,000 words in all spellings):
  // - a word in the dictionary, a word with capitals inside ("MOSFET", "ZnO") and a longer
  //   unknown word that is not part of any dictionary word ("plasmonic", "graphene") stay;
  // - an unknown word that is the start or end of dictionary words (1–3 letters longer)
  //   is a cut-off piece: repaired when one word fits best (the one also found elsewhere in
  //   the text, else the only shortest one), dropped when several fit equally;
  // - an unknown word one letter away from a word found elsewhere in the same text is
  //   fixed to it ("hoise" next to "noise");
  // - an unknown word of 3 letters or fewer is dropped.
  let dictionaryCache = null;
  function dictionaryOf(words) {
    if (dictionaryCache?.words !== words) dictionaryCache = {words, set: new Set(words)};
    return dictionaryCache.set;
  }
  const known = (lower, set) => set.has(lower) || [lower.replace(/s$/, ''), lower.replace(/es$/, ''), lower.replace(/ies$/, 'y'),
    lower.replace(/ed$/, ''), lower.replace(/ed$/, 'e'), lower.replace(/ing$/, ''), lower.replace(/ing$/, 'e')]
    .some(form => form.length >= 2 && set.has(form));
  function repairOcrText(text, words) {
    if (!Array.isArray(words) || !words.length) return String(text ?? '');
    const set = dictionaryOf(words);
    const source = String(text ?? '');
    const inText = new Set((source.match(/[A-Za-z]+/g) || []).map(word => word.toLowerCase()).filter(word => set.has(word)));
    const fixes = new Map();
    const repair = token => {
      if (/[A-Z]/.test(token.slice(1))) return token;            // MOSFET, ZnO, GaN
      const lower = token.toLowerCase();
      if (known(lower, set)) return token;
      if (lower.length <= 3) return '';
      if (!fixes.has(lower)) {
        const fits = [];
        for (const word of words) {
          const extra = word.length - lower.length;
          if (extra >= 1 && extra <= 3 && (word.endsWith(lower) || word.startsWith(lower))) fits.push(word);
        }
        let fix = lower;                                          // not a piece of a known word: keep
        // One letter misread ("hoise", "eross", "deviees"): fixed only to a word that is
        // also in this text and differs in exactly one letter, so nothing is guessed.
        const oneOff = [...inText].filter(word => word.length === lower.length &&
          [...word].filter((ch, i) => ch !== lower[i]).length === 1);
        if (oneOff.length === 1) fix = oneOff[0];
        else if (fits.length) {
          const seen = fits.filter(word => inText.has(word));
          const pool = seen.length ? seen : fits;
          const shortest = Math.min(...pool.map(word => word.length));
          const best = pool.filter(word => word.length === shortest);
          fix = best.length === 1 ? best[0] : '';
        }
        fixes.set(lower, fix);
      }
      const fix = fixes.get(lower);
      if (!fix) return '';
      return /^[A-Z]/.test(token) ? fix[0].toUpperCase() + fix.slice(1) : fix;
    };
    return source.replace(/[A-Za-z]+/g, (token, offset) => {
      // Parts of hyphenated or apostrophe words are left as they are ("cross-sectional").
      if (/[-'’]$/.test(source.slice(Math.max(0, offset - 1), offset)) || /^[-'’][A-Za-z]/.test(source.slice(offset + token.length, offset + token.length + 2))) return token;
      return repair(token);
    }).replace(/[ \t]{2,}/g, ' ');
  }

  const api = {extractCandidates, splitSentences, normalizeText, repairOcrText, FUNCTION_WORDS, COMMON_WORDS};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.WordCollectorTermExtract = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
