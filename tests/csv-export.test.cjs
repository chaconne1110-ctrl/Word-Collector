const {test}=require('node:test');
const assert=require('node:assert/strict');
const {toCsv,headers}=require('../www/csv-export.js');
const state={courses:{em:['전자기학','EM'],cir:['회로이론','Cir']},terms:{a:{course:'em',en:'Eddy current',ko:'와전류',discipline:'전기공학',enDef:'A, "quoted"\nmeaning',koDef:'정의',exampleEn:'example',exampleKo:'예문',diagram:'excluded',pos:'noun'},b:{course:'cir',en:'=HYPERLINK("x")',ko:'테스트'}}};
test('seven columns, BOM, quoting, newline and complete data without mutation',()=>{
 const before=JSON.stringify(state);const r=toCsv(state);
 assert.equal(headers.length,7);assert.equal(r.count,2);assert.ok(r.text.startsWith('\uFEFF'));
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
test('exact seven columns and meanings; non-output fields stay excluded',()=>{
 const {toRows}=require('../www/word-export.js');
 assert.deepEqual(headers,['전공','단어장 이름','표제어','한글 뜻','영어 정의','정의 한글해석','예문']);
 assert.deepEqual(toRows(state,'em')[1],['전기공학','전자기학','Eddy current','수정한 뜻','A, "quoted"\nmeaning','정의','example']);
 assert.ok(!toCsv(state).text.includes('예문 번역'));assert.equal(toRows(state,'cir')[1][0],'');
});
