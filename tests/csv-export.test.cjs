const {test}=require('node:test');
const assert=require('node:assert/strict');
const {toCsv,headers}=require('../www/csv-export.js');
const state={courses:{em:['전자기학','EM'],cir:['회로이론','Cir']},terms:{a:{course:'em',en:'Eddy current',ko:'와전류',discipline:'전기공학',enDef:'A, "quoted"\nmeaning',koDef:'정의',exampleEn:'example',exampleKo:'예문',diagram:'excluded',pos:'noun'},b:{course:'cir',en:'=HYPERLINK("x")',ko:'테스트'}}};
test('eight columns, BOM, quoting, newline and complete data without mutation',()=>{
 const before=JSON.stringify(state);const r=toCsv(state);
 assert.equal(headers.length,8);assert.equal(r.count,2);assert.ok(r.text.startsWith('\uFEFF'));
 assert.ok(r.text.includes('"A, ""quoted""\nmeaning"'));assert.ok(r.text.endsWith('\r\n'));
 assert.ok(!r.text.includes('excluded'));assert.ok(!r.text.includes('noun'));
 assert.equal(JSON.stringify(state),before);
});
test('course filtering, latest edits, blanks and formula protection',()=>{
 assert.equal(toCsv(state,'em').count,1);assert.equal(toCsv(state,'missing').count,0);
 assert.ok(toCsv(state).text.includes('"\'=HYPERLINK(""x"")"'));
 state.terms.a.ko='수정한 뜻';assert.ok(toCsv(state,'em').text.includes('수정한 뜻'));
 assert.equal(toCsv({courses:{},terms:{}}).count,0);assert.throws(()=>toCsv(null));
});
test('AI layout keeps original input separate; missing original is blank',()=>{
 const missing=toCsv(state,'em','ai');assert.ok(missing.text.includes('"","Eddy current"'));
 state.terms.a.originalTerm='와전류';assert.ok(toCsv(state,'em','ai').text.includes('"와전류","Eddy current"'));
 assert.throws(()=>toCsv(state,'','invalid'));
});
