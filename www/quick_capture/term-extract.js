// PDF·사진에서 단어 찾기: finds major-term candidates in English text read from a
// PDF or a photo (OCR). Runs in the browser (scan.js) and in Node unit tests.
//   - joins words broken by a hyphen at a line end ("induc-\ntance" → "inductance")
//   - single words that are not common everyday English (common words are left out)
//   - 2–3 word phrases (e.g. "skin effect", "power factor") that appear at least twice
//   - plural/singular forms are merged, a phrase inside a longer phrase with the same
//     count is dropped, and each candidate keeps the first sentence it appears in
// Nothing here is stored: the caller keeps only the words the user picks and their sentences.
(function(root) {
  'use strict';

  // Grammar words: never start, end or sit inside a phrase, never a candidate.
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
    consider assume certain important given apply known again later once twice next`.split(/\s+/).filter(Boolean));

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
  const isEveryday = lower => lower.split(/[-‐‑]/).every(part =>
    baseForms(part).some(form => FUNCTION_WORDS.has(form) || COMMON_WORDS.has(form)));
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
    const last = key.split(' ').pop();
    const head = key.slice(0, key.length - last.length);
    const forms = [];
    if (/ies$/.test(last)) forms.push(last.slice(0, -3) + 'y');
    if (/(?:s|x|z|ch|sh)es$/.test(last)) forms.push(last.slice(0, -2));
    if (/[^s]s$/.test(last)) forms.push(last.slice(0, -1));
    for (const form of forms) if (keys.has(head + form)) return head + form;
    return key;
  }

  function extractCandidates(text, {minPhraseCount = 2} = {}) {
    const found = new Map();   // key → {term forms, count, sentence, kind, words}
    const add = (key, surface, sentence, kind, size, first = false) => {
      let entry = found.get(key);
      if (!entry) found.set(key, entry = {key, forms: new Map(), count: 0, sentence: '', kind, size, lowerSeen: false, midCapital: false});
      entry.count++;
      if (/^[a-z]/.test(surface)) entry.lowerSeen = true;
      else if (!first) entry.midCapital = true;
      entry.forms.set(surface, (entry.forms.get(surface) || 0) + 1);
      if (!entry.sentence) entry.sentence = sentence;
    };
    for (const sentence of splitSentences(text)) {
      const tokens = [...sentence.matchAll(WORD)].map(match => ({
        surface: match[0].replace(/['’]s$/i, ''),
        lower: match[0].replace(/['’]s$/i, '').toLowerCase(),
        index: match.index
      }));
      // A phrase never spans punctuation, digits or symbols between its words.
      const joined = (a, b) => /^[\s-]*$/.test(sentence.slice(a.index + a.surface.length, b.index).replace(/['’]s/i, ''));
      tokens.forEach((token, i) => {
        const {surface, lower} = token;
        if (isAcronym(surface) ? !FUNCTION_WORDS.has(lower) : lower.length >= 3 && hasVowel(lower) && !isEveryday(lower)) {
          add(isAcronym(surface) ? surface.replace(/s$/, '') : lower, surface, sentence, 'word', 1, i === 0);
        }
        for (let size = 2; size <= 3; size++) {
          const words = tokens.slice(i, i + size);
          if (words.length < size) break;
          if (words.some(word => FUNCTION_WORDS.has(word.lower) || word.lower.length < 2)) break;
          if (words.slice(1).some((word, k) => !joined(words[k], word))) break;
          if (!words.some(word => word.lower.length >= 3)) continue;
          add(words.map(word => word.lower).join(' '), words.map(word => word.surface).join(' '), sentence, 'phrase', size);
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
    let candidates = [...found.values()].filter(entry => entry.kind === 'word' || entry.count >= minPhraseCount);
    // "power factor" inside "power factor correction" with the same count is the same use.
    const phrases = candidates.filter(entry => entry.kind === 'phrase');
    candidates = candidates.filter(entry => entry.kind === 'word' || !phrases.some(other =>
      other.size > entry.size && other.count === entry.count && (' ' + other.key + ' ').includes(' ' + entry.key + ' ')));
    return candidates.map(entry => {
      // Keep capitals only for acronyms, or names written with a capital every time
      // (also in the middle of a sentence, e.g. "Faraday").
      const forms = [...entry.forms.keys()];
      const name = entry.kind === 'word' && !entry.lowerSeen && entry.midCapital;
      const term = entry.kind === 'word' && isAcronym(forms[0]) ? entry.key :
        name ? entry.key[0].toUpperCase() + entry.key.slice(1) : entry.key;
      return {term, count: entry.count, kind: entry.kind, sentence: sentenceAround(entry.sentence, forms[0])};
    }).sort((a, b) => b.count - a.count || (a.kind === b.kind ? 0 : a.kind === 'phrase' ? -1 : 1) ||
      a.term.localeCompare(b.term));
  }

  const api = {extractCandidates, splitSentences, normalizeText, FUNCTION_WORDS, COMMON_WORDS};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.WordCollectorTermExtract = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
