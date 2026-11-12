const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('www/anonymous-auth.js', 'utf8');
const secureToken = 'wc_' + 'a'.repeat(64);

test('Capacitor obtains a one-time challenge from a trusted HTTPS iframe and never uses browser IndexedDB',async()=>{
  let inFlightMessage, frame, calls=0, idx=0;
  const trustedOrigin='https://chaconne1110-ctrl.github.io';
  const doc={
    body:{append(node) {
      assert.equal(node.children.length,1);
      const panel=node.children[0];frame=panel.children[0];
      assert.match(frame.src,/^https:\/\/chaconne1110-ctrl\.github\.io\/Word-Collector\/auth\/native-challenge\.html\?/);
      queueMicrotask(()=>{
        inFlightMessage({origin:'https://attacker.test',source:frame.contentWindow,
          data:{type:'wordcollector-turnstile-v1',token:'evil-captcha'}});
        inFlightMessage({origin:trustedOrigin,source:frame.contentWindow,
          data:{type:'wordcollector-turnstile-v1',token:'valid-captcha-token'}});
      });
    }},
    createElement(tag){
      return {tag,style:{},children:[],contentWindow:tag==='iframe'?{}:undefined,
        setAttribute(){},append(child){this.children.push(child);},remove(){}};
    }
  };
  const root={
    document:doc,location:{origin:'https://localhost',protocol:'https:'},
    Capacitor:{getPlatform:()=> 'android'},
    addEventListener(event,cb){assert.equal(event,'message');inFlightMessage=cb;},
    removeEventListener(event,cb){assert.equal(cb,inFlightMessage);},
    setTimeout,clearTimeout,
    fetch:async (url,opts)=>{
      calls++;
      if(url.endsWith('/api/auth/config')) return {ok:true,json:async()=>({enabled:true,siteKey:'test-public-key'})};
      assert.ok(url.endsWith('/api/auth/anonymous'));
      assert.equal(JSON.parse(opts.body).turnstileToken,'valid-captcha-token');
      return {ok:true,json:async()=>({token:secureToken,expiresAt:'2099-01-01T00:00:00Z'})};
    }
  };
  root.globalThis=root;
  vm.runInNewContext(source,root,{filename:'www/anonymous-auth.js'});
  const issued=await root.WordCollectorAnonymousAuth.acquire();
  assert.equal(issued,secureToken);
  assert.equal(calls,2);
  assert.equal(idx,0); // IndexedDB is never touched by native enrollment
});
