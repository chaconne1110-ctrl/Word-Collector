const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const terms = require('../www/partial-term.js');

test('English word alone saves with missing Korean translation, examples, definitions or POS',()=>{
  assert.equal(terms.validate({en:'Transformer',ko:'',pos:'',koDef:'',exampleEn:'',exampleKo:''}).ok,true);
});
test('Korean term alone saves without an English headword',()=>{
  assert.equal(terms.validate({en:'',ko:'변압기',pos:'',enDef:'',exampleEn:''}).ok,true);
});
test('both empty identifiers are refused, unrelated empty fields are fine',()=>{
  assert.equal(terms.validate({en:'',ko:''}).ok,false);
  assert.equal(terms.validate({en:'  ',ko:'  '}).ok,false);
  assert.equal(terms.validate({en:'Voltage',ko:''}).ok,true);
});
test('Korean pasted into English field is rejected; blank English is supported',()=>{
  assert.equal(terms.validate({en:'변압기',ko:'',enDef:''}).ok,false);
  assert.equal(terms.validate({en:'',ko:'변압기'}).ok,true);
});
test('different Korean-only terms are not accidentally deduplicated by empty English field',()=>{
  const existing={a:{course:'electric',en:'',ko:'변압기'},b:{course:'electric',en:'',ko:'콘덴서'}};
  assert.equal(terms.findExisting(existing,'electric',{en:'',ko:'변압기'})[0],'a');
  assert.equal(terms.findExisting(existing,'electric',{en:'',ko:'콘덴서'})[0],'b');
  assert.equal(terms.findExisting(existing,'electric',{en:'',ko:'저항'}),undefined);
  assert.equal(terms.findExisting(existing,'electric',{en:'Voltage',ko:''}),undefined);
  assert.equal(terms.findExisting(existing,'another',{en:'',ko:'변압기'}),undefined);
});
test('English duplicates still match ignoring case and whitespace',()=>{
  assert.equal(terms.findExisting({x:{course:'electric',en:'Transformer',ko:''}},'electric',{en:' transformer ',ko:''})[0],'x');
});
test('review and edit UI both use common partial validation, no required review inputs',()=>{
  const capture=fs.readFileSync('www/quick_capture/analysis.js','utf8');
  const app=fs.readFileSync('www/app.js','utf8');
  const page=fs.readFileSync('www/quick_capture/code.html','utf8');
  const edit=fs.readFileSync('www/edit.html','utf8');
  assert.match(capture,/input\.required = false/);
  assert.doesNotMatch(capture,/검토 항목을 모두 입력하세요/);
  assert.match(capture,/WordCollectorPartialTerm\.findExisting/);
  assert.match(capture,/WordCollectorPartialTerm\.validate/);
  assert.match(app,/WordCollectorPartialTerm\.validate\(updated\)/);
  assert.match(page,/partial-term\.js/);
  assert.match(edit,/partial-term\.js/);
});
